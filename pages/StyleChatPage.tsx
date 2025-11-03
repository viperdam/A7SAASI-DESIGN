import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { createChat } from '../services/geminiService';
import type { Language, ChatMessage, ChatInstance } from '../types';
import { MicrophoneIcon, SendIcon } from '../components/IconComponents';

const translations: Record<Language, any> = {
    en: { title: "Style Chat", subtitle: "Ask me anything about fashion or start a voice conversation.", text: "Text Chat", live: "Live Voice Chat", placeholder: "Ask for styling tips...", connect: "Start Voice Chat", connecting: "Connecting...", disconnect: "End Voice Chat", listening: "Listening...", speak: "Speak now", error: "Connection error." },
    ar: { title: "محادثة الأناقة", subtitle: "اسألني أي شيء عن الموضة أو ابدأ محادثة صوتية.", text: "محادثة نصية", live: "محادثة صوتية مباشرة", placeholder: "اطلب نصائح للتنسيق...", connect: "ابدأ المحادثة الصوتية", connecting: "جارٍ الاتصال...", disconnect: "إنهاء المحادثة الصوتية", listening: "أستمع...", speak: "تحدث الآن", error: "خطأ في الاتصال." },
    fr: { title: "Style Chat", subtitle: "Demandez-moi n'importe quoi sur la mode ou démarrez une conversation vocale.", text: "Chat texte", live: "Chat vocal en direct", placeholder: "Demandez des conseils de style...", connect: "Démarrer le chat vocal", connecting: "Connexion...", disconnect: "Terminer le chat vocal", listening: "Écoute...", speak: "Parlez maintenant", error: "Erreur de connexion." },
    es: { title: "Chat de Estilo", subtitle: "Pregúntame cualquier cosa sobre moda o inicia una conversación de voz.", text: "Chat de texto", live: "Chat de voz en vivo", placeholder: "Pide consejos de estilo...", connect: "Iniciar chat de voz", connecting: "Conectando...", disconnect: "Finalizar chat de voz", listening: "Escuchando...", speak: "Habla ahora", error: "Error de conexión." },
    zh: { title: "时尚聊天", subtitle: "向我询问任何关于时尚的问题或开始语音对话。", text: "文字聊天", live: "实时语音聊天", placeholder: "寻求造型建议...", connect: "开始语音聊天", connecting: "连接中...", disconnect: "结束语音聊天", listening: "正在聆听...", speak: "请说话", error: "连接错误。" },
    hi: { title: "स्टाइल चैट", subtitle: "फैशन के बारे में कुछ भी पूछें या वॉयस बातचीत शुरू करें।", text: "टेक्स्ट चैट", live: "लाइव वॉयс चैट", placeholder: "स्टाइलिंग टिप्स मांगें...", connect: "वॉयस चैट शुरू करें", connecting: "कनेक्ट हो रहा है...", disconnect: "वॉयस चैट समाप्त करें", listening: "सुन रहा हूँ...", speak: "अब बोलें", error: "कनेक्शन त्रुटि।" },
};

// Audio processing functions
const decode = (base64: string) => { const binaryString = atob(base64); const len = binaryString.length; const bytes = new Uint8Array(len); for (let i = 0; i < len; i++) { bytes[i] = binaryString.charCodeAt(i); } return bytes; };
const encode = (bytes: Uint8Array) => { let binary = ''; const len = bytes.byteLength; for (let i = 0; i < len; i++) { binary += String.fromCharCode(bytes[i]); } return btoa(binary); };

const createBlob = (data: Float32Array): Blob => {
  const l = data.length; const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) { int16[i] = data[i] * 32768; }
  return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
};

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer); const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) { channelData[i] = dataInt16[i * numChannels + channel] / 32768.0; }
    }
    return buffer;
}

export const StyleChatPage: React.FC<{ language: Language }> = ({ language }) => {
    const [activeTab, setActiveTab] = useState<'text' | 'live'>('text');
    const t = translations[language];

    // Text Chat State
    const [chat, setChat] = useState<ChatInstance | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isResponding, setIsResponding] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Live Chat State
    const [liveStatus, setLiveStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
    const [transcription, setTranscription] = useState('');
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    useEffect(() => {
        setMessages([]);
        setChat(createChat(language));
    }, [language]);


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    // Cleanup for live session
    useEffect(() => {
        return () => {
            if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then(session => session && session.close());
            }
            inputAudioContextRef.current?.close();
            outputAudioContextRef.current?.close();
        }
    }, [])

    const handleSendMessage = async () => {
        if (!userInput.trim() || !chat) return;
        const text = userInput;
        const newMessages: ChatMessage[] = [...messages, { role: 'user', text }];
        setMessages(newMessages);
        setUserInput('');
        setIsResponding(true);

        try {
            const response = await chat.sendMessage({ message: text });
            setMessages([...newMessages, { role: 'model', text: response.text }]);
        } catch (err) {
            console.error(err);
            setMessages([...newMessages, { role: 'model', text: "Sorry, I encountered an error." }]);
        } finally {
            setIsResponding(false);
        }
    };
    
    const toggleLiveChat = async () => {
        if (liveStatus === 'connected' || liveStatus === 'connecting') {
            setLiveStatus('idle');
            setTranscription('');
            if (sessionPromiseRef.current) {
                const session = await sessionPromiseRef.current;
                session.close();
                sessionPromiseRef.current = null;
            }
            if (scriptProcessorRef.current) {
                scriptProcessorRef.current.disconnect();
                mediaStreamSourceRef.current?.disconnect();
            }
            inputAudioContextRef.current?.close();
            outputAudioContextRef.current?.close();
            return;
        }

        setLiveStatus('connecting');
        setTranscription('');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

            let nextStartTime = 0;
            
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                },
                callbacks: {
                    onopen: () => {
                        setLiveStatus('connected');
                        const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
                        mediaStreamSourceRef.current = source;
                        const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;
                        
                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContextRef.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            setTranscription(message.serverContent.inputTranscription.text);
                        }
                        const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (audioData && outputAudioContextRef.current) {
                            const ctx = outputAudioContextRef.current;
                            nextStartTime = Math.max(nextStartTime, ctx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
                            const source = ctx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(ctx.destination);
                            source.start(nextStartTime);
                            nextStartTime += audioBuffer.duration;
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error(e);
                        setLiveStatus('error');
                        setTranscription(t.error);
                    },
                    onclose: () => {
                        setLiveStatus('idle');
                        setTranscription('');
                        stream.getTracks().forEach(track => track.stop());
                    },
                }
            });

        } catch (err) {
            console.error(err);
            setLiveStatus('error');
            setTranscription('Could not access microphone.');
        }
    }


    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
             <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-violet-400">{t.title}</h2>
                <p className="text-gray-400 mt-2">{t.subtitle}</p>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-t-lg border-b border-gray-700 flex justify-center gap-2">
                 <button onClick={() => setActiveTab('text')} className={`px-4 py-2 rounded-md font-medium ${activeTab === 'text' ? 'bg-pink-600' : 'bg-gray-700'}`}>{t.text}</button>
                 <button onClick={() => setActiveTab('live')} className={`px-4 py-2 rounded-md font-medium ${activeTab === 'live' ? 'bg-pink-600' : 'bg-gray-700'}`}>{t.live}</button>
            </div>
            <div className="bg-gray-800/50 rounded-b-lg">
                {activeTab === 'text' ? (
                     <div className="flex flex-col h-[60vh]">
                        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                            {messages.map((msg, index) => (
                                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-pink-600' : 'bg-gray-700'}`}>
                                        <p className="whitespace-pre-wrap">{msg.text}</p>
                                    </div>
                                </div>
                            ))}
                            {isResponding && (
                                <div className="flex justify-start">
                                    <div className="px-4 py-2 rounded-2xl bg-gray-700">
                                       <div className="flex items-center space-x-1">
                                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></div>
                                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300"></div>
                                       </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="p-4 border-t border-gray-700 flex gap-2">
                           <input type="text" value={userInput} onChange={e => setUserInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} placeholder={t.placeholder} className="flex-1 bg-gray-700/50 p-2 rounded-lg focus:ring-pink-500 focus:border-pink-500" />
                           <button onClick={handleSendMessage} className="p-2 bg-pink-600 rounded-lg hover:bg-pink-700"><SendIcon/></button>
                        </div>
                    </div>
                ) : (
                    <div className="h-[60vh] flex flex-col items-center justify-center text-center p-4">
                        <button onClick={toggleLiveChat} className={`relative flex items-center justify-center w-32 h-32 rounded-full transition-colors duration-300 ${liveStatus === 'connected' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}>
                            {liveStatus === 'connected' && <div className="absolute w-full h-full bg-red-500 rounded-full animate-ping opacity-75"></div>}
                            <MicrophoneIcon className="w-16 h-16 text-white"/>
                        </button>
                        <p className="mt-4 text-xl font-semibold">
                            {liveStatus === 'idle' && t.connect}
                            {liveStatus === 'connecting' && t.connecting}
                            {liveStatus === 'connected' && t.disconnect}
                            {liveStatus === 'error' && t.error}
                        </p>
                        <p className="mt-2 h-12 text-gray-400">
                            {liveStatus === 'connected' && (transcription || t.speak)}
                            {transcription && liveStatus !== 'connected' && transcription}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};