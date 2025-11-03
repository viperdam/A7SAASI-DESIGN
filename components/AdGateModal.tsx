import React from 'react';
import type { Language } from '../types';
import { PlayIcon } from './IconComponents';

interface AdGateModalProps {
  onWatchAd: () => void;
  onClose: () => void;
  language: Language;
}

const translations: Record<Language, any> = {
  en: { 
    title: "Unlock Your Personalized Outfits!", 
    subtitle: "Watch a short video ad to reveal your three AI-generated style concepts.",
    button: "Watch Ad to Continue",
    skip: "Maybe later",
  },
  ar: { 
    title: "افتح إطلالاتك المخصصة!", 
    subtitle: "شاهد إعلان فيديو قصير للكشف عن ثلاثة مفاهيم أسلوب تم إنشاؤها بواسطة الذكاء الاصطناعي.",
    button: "شاهد الإعلان للمتابعة",
    skip: "ربما لاحقًا",
  },
  fr: { 
    title: "Débloquez vos tenues personnalisées !", 
    subtitle: "Regardez une courte publicité vidéo pour révéler vos trois concepts de style générés par l'IA.",
    button: "Regarder la pub pour continuer",
    skip: "Peut-être plus tard",
  },
  es: { 
    title: "¡Desbloquea tus atuendos personalizados!", 
    subtitle: "Mira un breve anuncio de video para revelar tus tres conceptos de estilo generados por IA.",
    button: "Ver anuncio para continuar",
    skip: "Quizás más tarde",
  },
  zh: { 
    title: "解锁您的个性化服装！", 
    subtitle: "观看一个简短的视频广告，揭示您由AI生成的三个风格概念。",
    button: "观看广告以继续",
    skip: "以后再说",
  },
  hi: { 
    title: "अपनी व्यक्तिगत पोशाकें अनलॉक करें!", 
    subtitle: "अपने तीन एआई-जनित स्टाइल अवधारणाओं को प्रकट करने के लिए एक छोटा वीडियो विज्ञापन देखें।",
    button: "जारी रखने के लिए विज्ञापन देखें",
    skip: "शायद बाद में",
  },
};

export const AdGateModal: React.FC<AdGateModalProps> = ({ onWatchAd, onClose, language }) => {
  const t = translations[language] || translations.en;

  return (
    <div className="fixed inset-0 bg-[#111827]/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
      <div 
        className="bg-[#1F2937]/80 backdrop-blur-lg border border-[var(--border-color)] rounded-2xl shadow-2xl shadow-[#8B5CF6]/20 max-w-md w-full p-8 text-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ad-gate-title"
      >
        <h2 id="ad-gate-title" className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#EC4899] to-[#8B5CF6]">
          {t.title}
        </h2>
        <p className="text-[#9CA3AF] mt-4 mb-8">{t.subtitle}</p>
        
        {/* FIX: Add the PlayIcon to the button and adjust styling to properly align the icon and text. */}
        <button
          onClick={onWatchAd}
          className="w-full inline-flex items-center justify-center py-3 px-6 bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] text-white rounded-lg font-bold transition-all transform hover:scale-105 hover:shadow-xl hover:shadow-[#8B5CF6]/30 mb-4"
        >
          <PlayIcon className="w-6 h-6 mr-2" />
          {t.button}
        </button>

        <button
          onClick={onClose}
          className="text-sm text-[#9CA3AF] hover:text-white transition-colors"
        >
          {t.skip}
        </button>
      </div>
    </div>
  );
};
