import React, { useState } from 'react';
import type { StyleConcept, Language, GroundingChunk } from '../types';
import { ProductCard } from './ProductCard';
import { ArrowLeftIcon, ArrowRightIcon, MapPinIcon, WebIcon } from './IconComponents';

interface ResultsDisplayProps {
  concepts: StyleConcept[];
  onReset: () => void;
  onBackToPalettes: () => void; // New prop for back navigation
  language: Language;
}

const translations: Record<Language, any> = {
  en: { title: "Your AI-Generated Styles", concept: "Concept", items: "Shop The Look", styleTips: "Style & Grooming Tips", startOver: "Start Over", backToPalettes: "Choose Another Theme", sources: "Information Sources" },
  ar: { title: "ستايلاتك المصممة بالذكاء الاصطناعي", concept: "تصور", items: "تسوق الإطلالة", styleTips: "نصائح المظهر والتزيين", startOver: "ابدأ من جديد", backToPalettes: "اختر ثيمًا آخر", sources: "مصادر المعلومات" },
  fr: { title: "Vos styles générés par IA", concept: "Concept", items: "Acheter le look", styleTips: "Conseils Style & Soin", startOver: "Recommencer", backToPalettes: "Choisir un autre thème", sources: "Sources d'information" },
  es: { title: "Tus estilos generados por IA", concept: "Concepto", items: "Comprar el look", styleTips: "Consejos de Estilo y Arreglo", startOver: "Empezar de nuevo", backToPalettes: "Elegir otro tema", sources: "Fuentes de información" },
  zh: { title: "您的AI生成风格", concept: "概念", items: "购买造型", styleTips: "造型与修饰技巧", startOver: "重新开始", backToPalettes: "选择另一个主题", sources: "信息来源" },
  hi: { title: "आपकी AI-जनित शैलियाँ", concept: "अवधारणा", items: "लुक खरीदें", styleTips: "स्टाइल और ग्रूमिंग टिप्स", startOver: "फिर से शुरू करें", backToPalettes: "दूसरा थीम चुनें", sources: "सूचना सूत्र" },
};

const SecondaryButton: React.FC<{onClick: () => void, children: React.ReactNode}> = ({ onClick, children }) => (
    <button
        onClick={onClick}
        className="px-6 py-2 border border-[var(--border-color)] bg-transparent text-[#9CA3AF] hover:text-white hover:border-[#8B5CF6] rounded-lg font-bold transition-all text-sm"
    >
        {children}
    </button>
);

const GroundingCitations: React.FC<{ chunks: GroundingChunk[] }> = ({ chunks }) => {
    if (!chunks || chunks.length === 0) return null;

    return (
        <div className="mt-6 border-t border-[var(--border-color)] pt-4">
            <h5 className="text-sm font-semibold text-[#9CA3AF] mb-2">{translations.en.sources}:</h5>
            <div className="flex flex-wrap gap-2">
                {chunks.map((chunk, index) => {
                    if (chunk.web && chunk.web.uri) {
                        return (
                            <a key={`web-${index}`} href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-[#1F2937] text-xs text-[#9CA3AF] px-2 py-1 rounded-full hover:bg-[#8B5CF6] hover:text-white transition-colors">
                                <WebIcon /> {chunk.web.title || new URL(chunk.web.uri).hostname}
                            </a>
                        );
                    }
                    if (chunk.maps && chunk.maps.uri) {
                         return (
                            <a key={`maps-${index}`} href={chunk.maps.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-[#1F2937] text-xs text-[#9CA3AF] px-2 py-1 rounded-full hover:bg-[#8B5CF6] hover:text-white transition-colors">
                                <MapPinIcon /> {chunk.maps.title || 'View on Map'}
                            </a>
                        );
                    }
                    return null;
                })}
            </div>
        </div>
    );
};


export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ concepts, onReset, onBackToPalettes, language }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const t = translations[language];

  const nextConcept = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % concepts.length);
  };

  const prevConcept = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + concepts.length) % concepts.length);
  };

  const currentConcept = concepts[currentIndex];

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#EC4899] to-[#8B5CF6]">{t.title}</h2>
        <div className="mt-4 flex justify-center gap-4">
          <SecondaryButton onClick={onBackToPalettes}>{t.backToPalettes}</SecondaryButton>
          <SecondaryButton onClick={onReset}>{t.startOver}</SecondaryButton>
        </div>
      </div>

      <div className="flex items-center justify-center mb-4">
        <button onClick={prevConcept} className="p-2 rounded-full bg-[#1F2937] hover:bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] transition-all duration-300">
          <ArrowLeftIcon />
        </button>
        <span className="mx-4 text-lg font-semibold w-32 text-center">{`${t.concept} ${currentIndex + 1} / ${concepts.length}`}</span>
        <button onClick={nextConcept} className="p-2 rounded-full bg-[#1F2937] hover:bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] transition-all duration-300">
          <ArrowRightIcon />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Image Column */}
        <div className="lg:col-span-2 flex flex-col items-center">
            {currentConcept.imageUrl ? (
                <img 
                    src={currentConcept.imageUrl} 
                    alt={currentConcept.conceptName} 
                    className="rounded-2xl shadow-2xl shadow-[#8B5CF6]/20 object-cover w-full aspect-[3/4]"
                />
            ) : (
                <div className="rounded-2xl shadow-lg bg-[#1F2937] w-full aspect-[3/4] flex items-center justify-center">
                    <p className="text-gray-500">Image not available</p>
                </div>
            )}
        </div>

        {/* Details Column */}
        <div className="lg:col-span-3 bg-[#1F2937]/60 p-6 rounded-2xl border border-[var(--border-color)] backdrop-blur-lg">
          <h3 className="text-2xl font-bold text-[#EC4899]">{currentConcept.conceptName}</h3>
          <p className="text-[#9CA3AF] mt-2 mb-6 text-base leading-relaxed">{currentConcept.description}</p>
          
          {currentConcept.styleTipsDescription && (
            <div className="mb-6">
              <h4 className="text-xl font-semibold text-[#8B5CF6] mb-2">{t.styleTips}</h4>
              <p className="text-[#9CA3AF] text-base leading-relaxed">{currentConcept.styleTipsDescription}</p>
            </div>
          )}

          <h4 className="text-xl font-semibold text-[#8B5CF6] mb-4">{t.items}</h4>
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
            {currentConcept.items && currentConcept.items.length > 0 ? (
                currentConcept.items.map((item, index) => (
                    <ProductCard key={index} product={item} />
                ))
            ) : (
                <p className="text-gray-500 text-center py-4">No specific products were found for this look.</p>
            )}
          </div>
          <GroundingCitations chunks={currentConcept.groundingChunks || []} />
        </div>
      </div>
    </div>
  );
};