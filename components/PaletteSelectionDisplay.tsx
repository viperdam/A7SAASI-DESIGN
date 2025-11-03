import React from 'react';
import type { StylePalette, Language, UserInputs } from '../types';
import { jsPDF } from "jspdf";
import { amiriFontBase64 } from '../utils/amiriFont';
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
  en: { title: "Your Personalized Style Palettes", subtitle: "Based on our deep analysis, here are four tailored themes for you. Choose one to create shoppable outfits.", select: "Create Outfits With This Theme", startOver: "Start Over", backToForm: "Edit My Info", default: "Recommended", downloadPdf: "Download Report", pdfProfile: "Your Profile Analysis", pdfContext: "Context", pdfColors: "Core Palette", pdfWow: "Wow Colors", pdfStyleTips: "Style & Grooming Tips", pdfCelebs: "Celebrity Style Matches", pdfOccasion: "Occasion", pdfLocation: "Location", pdfWeather: "Weather" },
  ar: { title: "لوحات ألوانك المخصصة", subtitle: "بناءً على تحليلنا العميق، إليك أربعة ثيمات مصممة لك. اختر واحدة لإنشاء إطلالات قابلة للتسوق.", select: "أنشئ إطلالات بهذا الثيم", startOver: "ابدأ من جديد", backToForm: "تعديل معلوماتي", default: "مقترح", downloadPdf: "تحميل التقرير", pdfProfile: "تحليل ملفك الشخصي", pdfContext: "السياق", pdfColors: "الألوان الأساسية", pdfWow: "ألوان الإبهار", pdfStyleTips: "نصائح المظهر والتزيين", pdfCelebs: "مشاهير بنفس الستايل", pdfOccasion: "المناسبة", pdfLocation: "الموقع", pdfWeather: "الطقس" },
  fr: { title: "Vos Palettes de Style Personnalisées", subtitle: "Basé sur notre analyse approfondie, voici quatre thèmes sur mesure pour vous. Choisissez-en un pour créer des tenues.", select: "Créer des tenues avec ce thème", startOver: "Recommencer", backToForm: "Modifier mes infos", default: "Recommandé", downloadPdf: "Télécharger le rapport", pdfProfile: "Analyse de votre profil", pdfContext: "Contexte", pdfColors: "Palette de base", pdfWow: "Couleurs Wow", pdfStyleTips: "Conseils de style et de soin", pdfCelebs: "Célébrités au style similaire", pdfOccasion: "Occasion", pdfLocation: "Lieu", pdfWeather: "Météo" },
  es: { title: "Tus Paletas de Estilo Personalizadas", subtitle: "Basado en nuestro análisis, aquí tienes cuatro temas a medida. Elige uno para crear atuendos.", select: "Crear atuendos con este tema", startOver: "Empezar de nuevo", backToForm: "Editar mi info", default: "Recomendado", downloadPdf: "Descargar Informe", pdfProfile: "Análisis de tu perfil", pdfContext: "Contexto", pdfColors: "Paleta Principal", pdfWow: "Colores Impactantes", pdfStyleTips: "Consejos de Estilo", pdfCelebs: "Celebridades con Estilo Similar", pdfOccasion: "Ocasión", pdfLocation: "Ubicación", pdfWeather: "Clima" },
  zh: { title: "您的个性化风格调色板", subtitle: "根据我们的深入分析，这里有四个为您量身定制的主题。选择一个来创建可购买的服装。", select: "使用此主题创建服装", startOver: "重新开始", backToForm: "编辑我的信息", default: "推荐", downloadPdf: "下载报告", pdfProfile: "您的个人资料分析", pdfContext: "背景信息", pdfColors: "核心调色板", pdfWow: "惊喜色", pdfStyleTips: "风格与美容技巧", pdfCelebs: "风格匹配的名人", pdfOccasion: "场合", pdfLocation: "地点", pdfWeather: "天气" },
  hi: { title: "आपके व्यक्तिगत स्टाइल पैलेट", subtitle: "हमारे गहरे विश्लेषण के आधार पर, यहाँ आपके लिए चार अनुरूप थीम हैं। खरीदारी योग्य पोशाक बनाने के लिए एक चुनें।", select: "इस थीम के साथ आउटफिट बनाएं", startOver: "फिर से शुरू करें", backToForm: "मेरी जानकारी संपादित करें", default: "अनुशंसित", downloadPdf: "रिपोर्ट डाउनलोड करें", pdfProfile: "आपकी प्रोफ़ाइल का विश्लेषण", pdfContext: "संदर्भ", pdfColors: "मुख्य पैलेट", pdfWow: "वाह रंग", pdfStyleTips: "स्टाइल और ग्रूमिंग टिप्स", pdfCelebs: "मिलते-जुलते स्टाइल वाले सेलिब्रिटी", pdfOccasion: "अवसर", pdfLocation: "स्थान", pdfWeather: "मौसम" },
};

const generateStyleReportPDF = (palette: StylePalette, userInputs: UserInputs, language: Language) => {
    const doc = new jsPDF();
    const t = translations[language];
    const isRtl = language === 'ar';

    // Add Amiri font for Arabic support
    doc.addFileToVFS('Amiri-Regular.ttf', amiriFontBase64);
    doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
    doc.setFont('Amiri');
    
    if (isRtl) {
        doc.setR2L(true);
    }

    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    let y = 20;

    const writeText = (text: string, x: number, yPos: number, options: any = {}) => {
        const textLines = doc.splitTextToSize(text, pageWidth - (margin * 2));
        doc.text(textLines, isRtl ? pageWidth - x : x, yPos, options);
        return yPos + (textLines.length * 6);
    };

    // Title
    doc.setFontSize(22);
    doc.text(palette.pdfContent.title, pageWidth / 2, y, { align: 'center' });
    y += 15;

    // Introduction
    doc.setFontSize(12);
    y = writeText(palette.pdfContent.introduction, margin, y);
    y += 10;
    
    // --- User Profile Section ---
    doc.setFontSize(16);
    doc.text(t.pdfProfile, isRtl ? pageWidth - margin : margin, y);
    y += 8;
    doc.setFontSize(10);
    if (userInputs.userDescription) {
        y = writeText(userInputs.userDescription, margin, y);
        y += 5;
    }
    
    // --- Context Section ---
    doc.setFontSize(12);
    doc.text(t.pdfContext, isRtl ? pageWidth - margin : margin, y);
    y += 6;
    doc.setFontSize(10);
    const contextText = `${t.pdfOccasion}: ${userInputs.occasion}\n${t.pdfLocation}: ${userInputs.city}, ${userInputs.country}\n${userInputs.weather ? `${t.pdfWeather}: ${userInputs.weather}` : ''}`;
    y = writeText(contextText, margin, y);
    y += 10;

    // --- Color Palette Section ---
    const drawPalette = (title: string, colors: {name: string, hex: string}[]) => {
        if (y + 30 > pageHeight) {
            doc.addPage();
            y = 20;
        }
        doc.setFontSize(16);
        doc.text(title, isRtl ? pageWidth - margin : margin, y);
        y += 10;
        
        const colorBoxSize = 15;
        const colorBoxMargin = 5;
        let x = margin;
        
        colors.forEach(color => {
            if(isRtl) {
                if (x + colorBoxSize > pageWidth - margin) {
                    y += colorBoxSize + 20;
                    x = margin;
                }
                const currentX = pageWidth - x - colorBoxSize;
                doc.setFillColor(color.hex);
                doc.rect(currentX, y, colorBoxSize, colorBoxSize, 'F');
                doc.setFontSize(8);
                doc.text(color.name, currentX + colorBoxSize / 2, y + colorBoxSize + 5, { align: 'center'});
                x += colorBoxSize + colorBoxMargin;
            } else {
                 if (x + colorBoxSize > pageWidth - margin) {
                    y += colorBoxSize + 20;
                    x = margin;
                }
                doc.setFillColor(color.hex);
                doc.rect(x, y, colorBoxSize, colorBoxSize, 'F');
                doc.setFontSize(8);
                doc.text(color.name, x + colorBoxSize / 2, y + colorBoxSize + 5, { align: 'center'});
                x += colorBoxSize + colorBoxMargin;
            }
        });
        y += colorBoxSize + 25;
    };
    
    drawPalette(t.pdfColors, palette.colorPalette);
    drawPalette(t.pdfWow, palette.wowColors);
    
    // --- Detailed Sections ---
    palette.pdfContent.sections.forEach(section => {
        if (y + 10 > pageHeight) { doc.addPage(); y = 20; }
        doc.setFontSize(16);
        doc.text(section.title, isRtl ? pageWidth - margin : margin, y);
        y += 8;
        doc.setFontSize(10);
        y = writeText(section.content, margin, y);
        y += 10;
    });

    // Style Tips & Celebs
    if (y + 10 > pageHeight) { doc.addPage(); y = 20; }
    doc.setFontSize(16);
    doc.text(t.pdfStyleTips, isRtl ? pageWidth - margin : margin, y);
    y += 8;
    doc.setFontSize(10);
    y = writeText(palette.styleTips, margin, y);
    y += 10;

    if (y + 10 > pageHeight) { doc.addPage(); y = 20; }
    doc.setFontSize(16);
    doc.text(t.pdfCelebs, isRtl ? pageWidth - margin : margin, y);
    y += 8;
    doc.setFontSize(10);
    writeText(palette.celebrityExamples.join(', '), margin, y);
    
    doc.save(`Style_Report_${palette.paletteName.replace(/\s/g, '_')}.pdf`);
};


const PaletteCard: React.FC<{ palette: StylePalette, onSelect: () => void, language: Language, onDownloadPdf: () => void }> = ({ palette, onSelect, language, onDownloadPdf }) => {
    const t = translations[language];
    return (
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-6 flex flex-col justify-between transition-all duration-300 hover:border-pink-500 hover:shadow-2xl hover:shadow-pink-500/10 hover:-translate-y-2">
            <div>
                {palette.isDefault && (
                    <span className="absolute top-0 right-0 -mt-3 -mr-3 bg-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">{t.default}</span>
                )}
                <h3 className="text-xl font-bold text-pink-400 mb-2">{palette.paletteName}</h3>
                <div className="flex flex-wrap gap-2 mb-4 h-8 items-center">
                    {palette.colorPalette && palette.colorPalette.length > 0 && (
                        palette.colorPalette.slice(0, 8).map(color => (
                            <div key={color.hex} className="w-6 h-6 rounded-full border-2 border-gray-600" style={{ backgroundColor: color.hex }} title={color.name}></div>
                        ))
                    )}
                </div>
                <p className="text-sm text-gray-400 mb-4 h-20 overflow-hidden">{palette.description}</p>
            </div>
            <div className="space-y-3 mt-4">
                 <button onClick={onSelect} className="w-full text-center py-2 px-4 bg-violet-600 hover:bg-violet-700 rounded-lg font-bold transition-colors">
                    {t.select}
                </button>
                <button onClick={onDownloadPdf} className="w-full flex items-center justify-center text-center py-2 px-4 bg-gray-600 hover:bg-gray-500 rounded-lg font-bold transition-colors text-sm">
                    <DownloadIcon /> {t.downloadPdf}
                </button>
            </div>
        </div>
    );
};

export const PaletteSelectionDisplay: React.FC<PaletteSelectionDisplayProps> = ({ palettes, onSelect, onReset, onBackToForm, language, userInputs }) => {
  const t = translations[language];

  const handleDownloadPdf = (palette: StylePalette) => {
    if (!userInputs) {
        console.error("User inputs are not available for PDF generation.");
        // Optionally, show an alert to the user
        return;
    }
    generateStyleReportPDF(palette, userInputs, language);
  };
  
  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-violet-400">{t.title}</h2>
        <p className="text-gray-400 mt-2 max-w-2xl mx-auto">{t.subtitle}</p>
        <div className="mt-4 flex justify-center gap-4">
            <button
              onClick={onBackToForm}
              className="px-6 py-2 bg-violet-700 hover:bg-violet-600 rounded-lg font-bold transition-colors text-sm"
            >
              {t.backToForm}
            </button>
            <button
              onClick={onReset}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold transition-colors text-sm"
            >
              {t.startOver}
            </button>
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