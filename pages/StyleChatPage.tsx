import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createChat } from '../services/geminiService';
import { createBlob, decode, decodeAudioData } from '../utils/audioUtils';
import type { Language, ChatMessage, ChatInstance } from '../types';
import { MicrophoneIcon, SendIcon } from '../components/IconComponents';

const translations: Record<Language, any> = {
    en: { title: "Style Chat", subtitle: "Ask me anything about fashion or start a voice conversation.", text: "Text Chat", live: "Live Voice Chat", placeholder: "Ask for styling tips...", connect: "Start Voice Chat", connecting: "Connecting...", disconnect: "End Voice Chat", listening: "Listening...", speak: "Speak now", error: "Connection error." },
    ar: { title: "محادثة الأناقة", subtitle: "اسألني أي شيء عن الموضة أو ابدأ محادثة صوتية.", text: "محادثة نصية", live: "محادثة صوتية مباشرة", placeholder: "اطلب نصائح للتنسيق...", connect: "ابدأ المحادثة الصوتية", connecting: "جارٍ الاتصال...", disconnect: "إنهاء المحادثة الصوتية", listening: "أستمع...", speak: "تحدث الآن", error: "خطأ في الاتصال." },
    fr: { title: "Style Chat", subtitle: "Demandez-moi n'importe quoi sur la mode ou démarrez une conversation vocale.", text: "Chat texte", live: "Chat vocal en direct", placeholder: "Demandez des conseils de style...", connect: "Démarrer le chat vocal", connecting: "Connexion...", disconnect: "Terminer le chat vocal", listening: "Écoute...", speak: "Parlez maintenant", error: "Erreur de connexion." },
    es: { title: "Chat de Estilo", subtitle: "Pregúntame cualquier cosa sobre moda o inicia una conversación de voz.", text: "Chat de texto", live: "Chat de voz en vivo", placeholder: "Pide consejos de estilo...", connect: "Iniciar chat de voz", connecting: "Conectando...", disconnect: "Finalizar chat de voz", listening: "Escuchando...", speak: "Habla ahora", error: "Error de conexión." },
    zh: { title: "时尚聊天", subtitle: "向我询问任何关于时尚的问题或开始语音对话。", text: "文字聊天", live: "实时语音聊天", placeholder: "寻求造型建议...", connect: "开始语音聊天", connecting: "连接中...", disconnect: "结束语音聊天", listening: "正在聆听...", speak: "请说话", error: "连接错误。" },
    hi: { title: "स्टाइल चैट", subtitle: "फैशन के बारे में कुछ भी पूछें या वॉयस बातचीत शुरू करें।", text: "टेक्स्ट चैट", live: "लाइव वॉयस चैट", placeholder: "स्टाइलिंग टिप्स मांगें...", connect: "वॉयस चैट शुरू करें", connecting: "कनेक्ट हो रहा है...", disconnect: "वॉयस चैट समाप्त करें", listening: "सुन रहा हूँ...", speak: "अब बोलें", error: "कनेक्शन त्रुटि।" },
};

const TabButton: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`relative w-full px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ease-in-out group ${
      isActive ? 'text-white' : 'text-[#9CA3AF] hover:text-white'
    }`}
  >
    <span className="relative z-10">{label}</span>
    {isActive && (
      <span className="absolute inset-0 bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] rounded-md shadow-lg shadow-[#8B5CF6]/30"></span>
    )}
  </button>
);


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
                <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#EC4899] to-[#8B5CF6]">{t.title}</h2>
                <p className="text-[#9CA3AF] mt-2">{t.subtitle}</p>
            </div>
             <div className="bg-[#1F2937]/60 p-1 rounded-lg border border-[var(--border-color)] flex justify-center gap-2 max-w-sm mx-auto mb-8">
                 <TabButton label={t.text} isActive={activeTab === 'text'} onClick={() => setActiveTab('text')} />
                 <TabButton label={t.live} isActive={activeTab === 'live'} onClick={() => setActiveTab('live')} />
            </div>
            <div className="bg-[#1F2937]/60 rounded-b-lg border border-[var(--border-color)] backdrop-blur-lg">
                {activeTab === 'text' ? (
                     <div className="flex flex-col h-[60vh]">
                        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                            {messages.map((msg, index) => (
                                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-gradient-to-r from-[#EC4899] to-[#8B5CF6]' : 'bg-[#111827]'}`}>
                                        <p className="whitespace-pre-wrap text-white">{msg.text}</p>
                                    </div>
                                </div>
                            ))}
                            {isResponding && (
                                <div className="flex justify-start">
                                    <div className="px-4 py-2 rounded-2xl bg-[#111827]">
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
                        <div className="p-4 border-t border-[var(--border-color)] flex gap-2">
                           <input type="text" value={userInput} onChange={e => setUserInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} placeholder={t.placeholder} className="flex-1 bg-[#111827] border-[var(--border-color)] rounded-lg p-2 focus:ring-2 focus:ring-[#EC4899] focus:border-[#EC4899] transition" />
                           <button onClick={handleSendMessage} className="p-3 bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] rounded-lg hover:shadow-lg hover:shadow-[#8B5CF6]/30 transition"><SendIcon/></button>
                        </div>
                    </div>
                ) : (
                    <div className="h-[60vh] flex flex-col items-center justify-center text-center p-4">
                        <button onClick={toggleLiveChat} className={`relative flex items-center justify-center w-32 h-32 rounded-full transition-all duration-300 ${liveStatus === 'connected' ? 'bg-red-500 hover:bg-red-600' : 'bg-gradient-to-r from-[#EC4899] to-[#8B5CF6]'}`}>
                            {(liveStatus === 'connected' || liveStatus === 'connecting') && <div className={`absolute w-full h-full rounded-full animate-ping opacity-75 ${liveStatus === 'connected' ? 'bg-red-500' : 'bg-pink-500'}`}></div>}
                            <MicrophoneIcon className="w-16 h-16 text-white"/>
                        </button>
                        <p className="mt-4 text-xl font-semibold">
                            {liveStatus === 'idle' && t.connect}
                            {liveStatus === 'connecting' && t.connecting}
                            {liveStatus === 'connected' && t.disconnect}
                            {liveStatus === 'error' && t.error}
                        </p>
                        <p className="mt-2 h-12 text-[#9CA3AF]">
                            {liveStatus === 'connected' && (transcription || t.speak)}
                            {transcription && liveStatus !== 'connected' && transcription}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};