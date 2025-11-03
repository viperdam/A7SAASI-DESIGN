import React, { useState, useCallback, useEffect } from 'react';
import { editImage, generateVideo } from '../services/geminiService';
import { UploadIcon } from '../components/IconComponents';
import type { Language, VideoGenerationState } from '../types';

// Helper function to convert a file to a base64 string
const fileToDataUrl = (file: File): Promise<{ base64: string, mimeType: string, dataUrl: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve({ base64, mimeType: file.type, dataUrl: result });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const translations: Record<Language, any> = {
    en: { title: "Style Lab", subtitle: "Edit images and create videos with AI.", edit: "Edit Image", video: "Create Video", upload: "Upload an image to start", prompt: "Describe your edit...", promptVideo: "Describe the video scene...", generate: "Generate", generating: "Generating...", error: "An error occurred.", selectKey: "Select API Key", keyDesc: "Video generation requires an API key and an active billing account.", videoSuccess: "Video generated successfully!", aspectRatio: "Aspect Ratio", billingLink: "Learn more about billing" },
    ar: { title: "مختبر الأناقة", subtitle: "عدّل الصور وأنشئ فيديوهات بالذكاء الاصطناعي.", edit: "تعديل الصورة", video: "إنشاء فيديو", upload: "ارفع صورة للبدء", prompt: "صف التعديل الذي تريده...", promptVideo: "صف مشهد الفيديو...", generate: "إنشاء", generating: "جاري الإنشاء...", error: "حدث خطأ.", selectKey: "اختر مفتاح API", keyDesc: "يتطلب إنشاء الفيديو مفتاح API وحساب فوترة نشط.", videoSuccess: "تم إنشاء الفيديو بنجاح!", aspectRatio: "نسبة العرض إلى الارتفاع", billingLink: "اعرف المزيد عن الفوترة" },
    fr: { title: "Style Lab", subtitle: "Éditez des images et créez des vidéos avec l'IA.", edit: "Modifier l'image", video: "Créer une vidéo", upload: "Chargez une image pour commencer", prompt: "Décrivez votre modification...", promptVideo: "Décrivez la scène vidéo...", generate: "Générer", generating: "Génération...", error: "Une erreur est survenue.", selectKey: "Sélectionnez la clé API", keyDesc: "La génération de vidéo nécessite une clé API et un compte de facturation actif.", videoSuccess: "Vidéo générée avec succès !", aspectRatio: "Ratio d'aspect", billingLink: "En savoir plus sur la facturation" },
    es: { title: "Laboratorio de Estilo", subtitle: "Edita imágenes y crea videos con IA.", edit: "Editar Imagen", video: "Crear Video", upload: "Sube una imagen para empezar", prompt: "Describe tu edición...", promptVideo: "Describe la escena del video...", generate: "Generar", generating: "Generando...", error: "Ocurrió un error.", selectKey: "Seleccionar clave API", keyDesc: "La generación de video requiere una clave API y una cuenta de facturación activa.", videoSuccess: "¡Video generado con éxito!", aspectRatio: "Relación de aspecto", billingLink: "Más información sobre la facturación" },
    zh: { title: "风格实验室", subtitle: "使用AI编辑图像和创建视频。", edit: "编辑图像", video: "创建视频", upload: "上传图片开始", prompt: "描述您的编辑...", promptVideo: "描述视频场景...", generate: "生成", generating: "生成中...", error: "发生错误。", selectKey: "选择API密钥", keyDesc: "视频生成需要API密钥和有效的结算帐户。", videoSuccess: "视频生成成功！", aspectRatio: "纵横比", billingLink: "了解有关结算的更多信息" },
    hi: { title: "स्टाइल लैब", subtitle: "AI के साथ चित्र संपादित करें और वीडियो बनाएं।", edit: "छवि संपादित करें", video: "वीडियो बनाएं", upload: "शुरू करने के लिए एक छवि अपलोड करें", prompt: "अपने संपादन का वर्णन करें...", promptVideo: "वीडियो दृश्य का वर्णन करें...", generate: "उत्पन्न करें", generating: "उत्पन्न हो रहा है...", error: "एक त्रुटि हुई।", selectKey: "एपीआई कुंजी चुनें", keyDesc: "वीडियो बनाने के लिए एक एपीआई कुंजी और एक सक्रिय बिलिंग खाते की आवश्यकता है।", videoSuccess: "वीडियो सफलतापूर्वक बन गया!", aspectRatio: "पहलू अनुपात", billingLink: "बिलिंग के बारे में और जानें" },
};

export const StyleLabPage: React.FC<{ language: Language }> = ({ language }) => {
    const [activeTab, setActiveTab] = useState<'edit' | 'video'>('edit');
    const [sourceImage, setSourceImage] = useState<{ base64: string; mimeType: string; dataUrl: string } | null>(null);
    const [resultMedia, setResultMedia] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [videoState, setVideoState] = useState<VideoGenerationState>('idle');
    const [videoMessage, setVideoMessage] = useState('');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('9:16');
    
    const t = translations[language];

    useEffect(() => {
        if (activeTab === 'video') {
            (window as any).aistudio?.hasSelectedApiKey().then((hasKey: boolean) => {
                if (!hasKey) {
                    setVideoState('selecting_key');
                } else {
                    setVideoState('idle');
                }
            });
        }
    }, [activeTab]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setResultMedia(null);
            setError(null);
            const imageData = await fileToDataUrl(file);
            setSourceImage(imageData);
        }
    };

    const handleEditSubmit = async () => {
        if (!sourceImage || !prompt) return;
        setIsLoading(true);
        setError(null);
        setResultMedia(null);
        try {
            const editedImageUrl = await editImage(sourceImage.base64, sourceImage.mimeType, prompt);
            setResultMedia(editedImageUrl);
        } catch (err) {
            setError(t.error);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleVideoSubmit = async () => {
        if (!sourceImage || !prompt) return;
        setError(null);
        setResultMedia(null);

        try {
            const hasKey = await (window as any).aistudio.hasSelectedApiKey();
            if (!hasKey) {
                setVideoState('selecting_key');
                return;
            }
            
            setVideoState('generating');
            setVideoMessage("Warming up the cameras...");
            
            const videoUrl = await generateVideo(prompt, sourceImage, aspectRatio);

            setResultMedia(videoUrl);
            setVideoState('success');
            setVideoMessage(t.videoSuccess);
        } catch(err: any) {
             console.error(err);
             if (err.message?.includes("Requested entity was not found")) {
                 setVideoState('selecting_key');
                 setError("API Key error. Please select a valid key and ensure your project has billing enabled. See ai.google.dev/gemini-api/docs/billing for details.");
                 await (window as any).aistudio.openSelectKey();
             } else {
                setVideoState('error');
                setError(err.message || t.error);
             }
        }
    };

    const isGeneratingVideo = videoState === 'generating' || videoState === 'polling';
    
    return (
        <div className="max-w-6xl mx-auto animate-fade-in">
            <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-violet-400">{t.title}</h2>
                <p className="text-gray-400 mt-2">{t.subtitle}</p>
            </div>

            <div className="bg-gray-800/50 p-4 rounded-t-lg border-b border-gray-700 flex justify-center gap-2">
                 <button onClick={() => setActiveTab('edit')} className={`px-4 py-2 rounded-md font-medium ${activeTab === 'edit' ? 'bg-pink-600' : 'bg-gray-700'}`}>{t.edit}</button>
                 <button onClick={() => setActiveTab('video')} className={`px-4 py-2 rounded-md font-medium ${activeTab === 'video' ? 'bg-pink-600' : 'bg-gray-700'}`}>{t.video}</button>
            </div>
            
            <div className="bg-gray-800/50 p-6 rounded-b-lg grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Media Display */}
                <div className="flex flex-col gap-4">
                    {!sourceImage ? (
                        <div className="relative w-full aspect-[3/4] border-2 border-gray-600 border-dashed rounded-md flex flex-col justify-center items-center">
                           <UploadIcon />
                           <p className="text-gray-500 mt-2">{t.upload}</p>
                           <input type="file" className="absolute w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} accept="image/*" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                           <img src={sourceImage.dataUrl} alt="Source" className="w-full rounded-lg aspect-[3/4] object-cover" />
                           {isLoading || isGeneratingVideo ? (
                               <div className="w-full bg-gray-700 rounded-lg flex flex-col items-center justify-center aspect-[3/4]">
                                   <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-pink-500"></div>
                                   <p className="text-sm mt-2 text-center px-2">{videoMessage || t.generating}</p>
                               </div>
                           ) : resultMedia ? (
                                activeTab === 'edit' ?
                                <img src={resultMedia} alt="Result" className="w-full rounded-lg aspect-[3/4] object-cover" />
                                : <video src={resultMedia} controls autoPlay loop className="w-full rounded-lg aspect-[3/4] object-cover"></video>
                           ) : (
                                <div className="w-full bg-gray-700 rounded-lg flex items-center justify-center aspect-[3/4] text-gray-500">Result will appear here</div>
                           )}
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="flex flex-col gap-4">
                     <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={activeTab === 'edit' ? t.prompt : t.promptVideo} rows={4} className="w-full bg-gray-700/50 border-gray-600 rounded-md p-2 focus:ring-pink-500 focus:border-pink-500" disabled={!sourceImage}></textarea>
                     
                     {activeTab === 'video' && (
                        <div>
                          <label className="text-sm text-gray-300">{t.aspectRatio}</label>
                          <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as '16:9' | '9:16')} className="mt-1 block w-full bg-gray-700/50 border-gray-600 rounded-md p-2">
                             <option value="9:16">9:16 (Portrait)</option>
                             <option value="16:9">16:9 (Landscape)</option>
                          </select>
                        </div>
                     )}

                     {error && <p className="text-red-400 text-sm">{error}</p>}
                     
                     {activeTab === 'edit' ? (
                        <button onClick={handleEditSubmit} disabled={!sourceImage || !prompt || isLoading} className="w-full py-3 px-6 bg-violet-600 hover:bg-violet-700 rounded-lg font-bold disabled:bg-gray-600 disabled:cursor-not-allowed">{isLoading ? t.generating : t.generate}</button>
                     ) : videoState === 'selecting_key' ? (
                        <div className="bg-yellow-900/50 border border-yellow-700 p-4 rounded-lg text-center">
                            <p className="text-yellow-300 mb-2 text-sm">{t.keyDesc}</p>
                            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-xs text-yellow-400 hover:underline mb-4 block">{t.billingLink}</a>
                            <button 
                                onClick={async () => {
                                    await (window as any).aistudio.openSelectKey();
                                    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
                                    if(hasKey) setVideoState('idle');
                                }} 
                                className="w-full py-2 px-4 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-bold text-sm">
                                {t.selectKey}
                            </button>
                        </div>
                     ) : (
                        <button onClick={handleVideoSubmit} disabled={!sourceImage || !prompt || isGeneratingVideo} className="w-full py-3 px-6 bg-violet-600 hover:bg-violet-700 rounded-lg font-bold disabled:bg-gray-600 disabled:cursor-not-allowed">{isGeneratingVideo ? t.generating : t.generate}</button>
                     )}
                </div>
            </div>
        </div>
    );
};