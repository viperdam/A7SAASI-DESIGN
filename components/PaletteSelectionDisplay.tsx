import React from 'react';
import type { StylePalette, Language, UserInputs } from '../types';
import { generateStyleReportPDF } from '../utils/pdfUtils';
import { DownloadIcon } from './IconComponents';

interface PaletteSelectionDisplayProps {
  palettes: StylePalette[];
  onSelect: (palette: StylePalette) => void;
  onReset: () => void;
  onBackToForm: () => void;
  language: Language;
  userInputs: UserInputs | null;
}

const translations: Record<Language, any> = {
  en: { title: "Your Personalized Style Palettes", subtitle: "Based on our deep analysis, here are four tailored themes for you. Choose one to create shoppable outfits.", select: "Create Outfits With This Theme", startOver: "Start Over", backToForm: "Edit My Info", default: "Recommended", downloadPdf: "Download Report" },
  ar: { title: "لوحات ألوانك المخصصة", subtitle: "بناءً على تحليلنا العميق، إليك أربعة ثيمات مصممة لك. اختر واحدة لإنشاء إطلالات قابلة للتسوق.", select: "أنشئ إطلالات بهذا الثيم", startOver: "ابدأ من جديد", backToForm: "تعديل معلوماتي", default: "مقترح", downloadPdf: "تحميل التقرير" },
  fr: { title: "Vos Palettes de Style Personnalisées", subtitle: "Basé sur notre analyse approfondie, voici quatre thèmes sur mesure pour vous. Choisissez-en un pour créer des tenues.", select: "Créer des tenues avec ce thème", startOver: "Recommencer", backToForm: "Modifier mes infos", default: "Recommandé", downloadPdf: "Télécharger le rapport" },
  es: { title: "Tus Paletas de Estilo Personalizadas", subtitle: "Basado en nuestro análisis, aquí tienes cuatro temas a medida. Elige uno para crear atuendos.", select: "Crear atuendos con este tema", startOver: "Empezar de nuevo", backToForm: "Editar mi info", default: "Recomendado", downloadPdf: "Descargar Informe" },
  zh: { title: "您的个性化风格调色板", subtitle: "根据我们的深入分析，这里有四个为您量身定制的主题。选择一个来创建可购买的服装。", select: "使用此主题创建服装", startOver: "重新开始", backToForm: "编辑我的信息", default: "推荐", downloadPdf: "下载报告" },
  hi: { title: "आपके व्यक्तिगत स्टाइल पैलेट", subtitle: "हमारे गहरे विश्लेषण के आधार पर, यहाँ आपके लिए चार अनुरूप थीम हैं। खरीदारी योग्य पोशाक बनाने के लिए एक चुनें।", select: "इस थीम के साथ आउटफिट बनाएं", startOver: "फिर से शुरू करें", backToForm: "मेरी जानकारी संपादित करें", default: "अनुशंसित", downloadPdf: "रिपोर्ट डाउनलोड करें" },
};


const PaletteCard: React.FC<{ palette: StylePalette, onSelect: () => void, language: Language, onDownloadPdf: () => void }> = ({ palette, onSelect, language, onDownloadPdf }) => {
    const t = translations[language];
    return (
        <div className="bg-[#1F2937]/60 rounded-2xl border border-[var(--border-color)] p-6 flex flex-col justify-between transition-all duration-300 hover:border-[#EC4899]/50 hover:shadow-2xl hover:shadow-[#8B5CF6]/10 hover:-translate-y-2 relative group">
            <div>
                {palette.isDefault && (
                    <span className="absolute -top-3 right-4 bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] text-white text-xs font-bold px-3 py-1 rounded-full">{t.default}</span>
                )}
                <h3 className="text-xl font-bold text-[#EC4899] mb-2">{palette.paletteName}</h3>
                <div className="flex flex-wrap gap-2 mb-4 h-8 items-center">
                    {palette.colorPalette && palette.colorPalette.length > 0 && (
                        palette.colorPalette.slice(0, 8).map(color => (
                            <div key={color.hex} className="w-6 h-6 rounded-full border-2 border-gray-600" style={{ backgroundColor: color.hex }} title={color.name}></div>
                        ))
                    )}
                </div>
                <p className="text-sm text-[#9CA3AF] mb-4 h-20 overflow-hidden">{palette.description}</p>
            </div>
            <div className="space-y-3 mt-4">
                 <button onClick={onSelect} className="w-full text-center py-2 px-4 bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] hover:shadow-lg hover:shadow-[#8B5CF6]/30 rounded-lg font-bold transition-all transform hover:scale-105">
                    {t.select}
                </button>
                <button onClick={onDownloadPdf} className="w-full flex items-center justify-center text-center py-2 px-4 bg-[#1F2937] hover:bg-gray-700 text-[#9CA3AF] hover:text-white rounded-lg font-bold transition-colors text-sm">
                    <DownloadIcon /> {t.downloadPdf}
                </button>
            </div>
        </div>
    );
};

const SecondaryButton: React.FC<{onClick: () => void, children: React.ReactNode}> = ({ onClick, children }) => (
    <button
        onClick={onClick}
        className="px-6 py-2 border border-[var(--border-color)] bg-transparent text-[#9CA3AF] hover:text-white hover:border-[#8B5CF6] rounded-lg font-bold transition-all text-sm"
    >
        {children}
    </button>
);


export const PaletteSelectionDisplay: React.FC<PaletteSelectionDisplayProps> = ({ palettes, onSelect, onReset, onBackToForm, language, userInputs }) => {
  const t = translations[language];

  const handleDownloadPdf = (palette: StylePalette) => {
    if (!userInputs) {
        console.error("User inputs are not available for PDF generation.");
        return;
    }
    generateStyleReportPDF(palette, userInputs, language);
  };
  
  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#EC4899] to-[#8B5CF6]">{t.title}</h2>
        <p className="text-[#9CA3AF] mt-2 max-w-2xl mx-auto">{t.subtitle}</p>
        <div className="mt-4 flex justify-center gap-4">
            <SecondaryButton onClick={onBackToForm}>{t.backToForm}</SecondaryButton>
            <SecondaryButton onClick={onReset}>{t.startOver}</SecondaryButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {palettes.map((palette) => (
          <PaletteCard key={palette.paletteName} palette={palette} onSelect={() => onSelect(palette)} language={language} onDownloadPdf={() => handleDownloadPdf(palette)} />
        ))}
      </div>
    </div>
  );
};
