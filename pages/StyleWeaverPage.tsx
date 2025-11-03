import React, { useState, useCallback, useEffect, useRef } from 'react';
import { StylingForm } from '../components/StylingForm';
import { ResultsDisplay } from '../components/ResultsDisplay';
import { PaletteSelectionDisplay } from '../components/PaletteSelectionDisplay';
import { Loader } from '../components/Loader';
import { analyzeStyleAndGeneratePalettes, generateSingleOutfitFromPalette, generateInitialImage } from '../services/geminiService';
import type { UserInputs, StyleConcept, StylePalette, Language, AppStep } from '../types';

interface StyleWeaverPageProps {
  language: Language;
}

export const StyleWeaverPage: React.FC<StyleWeaverPageProps> = ({ language }) => {
  const [appStep, setAppStep] = useState<AppStep>('input');
  const [userInputs, setUserInputs] = useState<UserInputs | null>(null);
  const [stylePalettes, setStylePalettes] = useState<StylePalette[]>([]);
  const [selectedPalette, setSelectedPalette] = useState<StylePalette | null>(null);
  const [styleConcepts, setStyleConcepts] = useState<StyleConcept[]>([]);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentPosition, setCurrentPosition] = useState<GeolocationPosition | undefined>(undefined);
  const prevLangRef = useRef(language);


  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => setCurrentPosition(position),
      (err) => console.warn(`Could not get geolocation: ${err.message}`)
    );
  }, []);

  useEffect(() => {
    // Re-fetch palettes if language changes after initial analysis
    if (prevLangRef.current !== language && userInputs && (appStep === 'paletteSelection' || appStep === 'results')) {
        const reAnalyzeForLanguageChange = async () => {
            setAppStep('loadingAnalysis');
            setError(null);
            setStylePalettes([]);
            setStyleConcepts([]); // Clear concepts as they are language-specific
            setSelectedPalette(null);
            setLoadingMessage('Translating your palettes...');

            try {
                // We use userInputs from state which contains the detailed userDescription
                const { palettes, userDescription } = await analyzeStyleAndGeneratePalettes(userInputs, language);
                setUserInputs(currentInputs => ({ ...currentInputs!, userDescription })); // Update with potentially re-described user
                setStylePalettes(palettes);
                setAppStep('paletteSelection'); // Return to palette selection
            } catch (err) {
                console.error(err);
                setError('An error occurred while translating your palettes. Please try again.');
                setAppStep('input');
            } finally {
                setLoadingMessage('');
            }
        };
        reAnalyzeForLanguageChange();
    }
    prevLangRef.current = language;
  }, [language, userInputs, appStep]);


  const handleAnalysisSubmit = useCallback(async (inputs: UserInputs) => {
    setUserInputs(inputs);
    setAppStep('loadingAnalysis');
    setError(null);
    setStylePalettes([]);
    setLoadingMessage('Performing deep style analysis...');

    try {
      const { palettes, userDescription } = await analyzeStyleAndGeneratePalettes(inputs, language);
      setUserInputs(currentInputs => ({ ...currentInputs!, ...inputs, userDescription }));
      setStylePalettes(palettes);
      setAppStep('paletteSelection');
    } catch (err) {
      console.error(err);
      setError('An error occurred during style analysis. Please try again.');
      setAppStep('input');
    } finally {
      setLoadingMessage('');
    }
  }, [language]);
  
  const handlePaletteSelection = useCallback(async (palette: StylePalette) => {
      if (!userInputs || !userInputs.userDescription || !userInputs.photos) {
          setError('User inputs were lost. Please start over.');
          setAppStep('input');
          return;
      }
      setSelectedPalette(palette);
      setAppStep('loadingOutfits');
      setError(null);
      setStyleConcepts([]);
      
      try {
        const generatedConcepts: StyleConcept[] = [];
        for (let i = 0; i < 3; i++) {
            setLoadingMessage(`Designing unique outfit ${i + 1} of 3...`);
            const newConcept = await generateSingleOutfitFromPalette(userInputs, palette, language, currentPosition, generatedConcepts);
            generatedConcepts.push(newConcept);
        }

        const conceptsWithImages = [];
        for (let i = 0; i < generatedConcepts.length; i++) {
          setLoadingMessage(`Generating realistic style preview ${i + 1} of ${generatedConcepts.length}...`);
          const concept = generatedConcepts[i];
          const imageUrl = await generateInitialImage(concept.imagePrompt, userInputs);
          conceptsWithImages.push({
            ...concept,
            imageUrl: imageUrl,
          });
        }
        
        setStyleConcepts(conceptsWithImages);
        setAppStep('results');
      } catch (err) {
          console.error(err);
          setError('An error occurred while generating your outfits. Please try again.');
          // Go back to palette selection on failure
          setAppStep('paletteSelection');
      } finally {
          setLoadingMessage('');
      }

  }, [language, userInputs, currentPosition]);

  const handleReset = () => {
    setAppStep('input');
    setUserInputs(null);
    setStyleConcepts([]);
    setStylePalettes([]);
    setSelectedPalette(null);
    setError(null);
  };
  
  const handleBackToForm = () => {
    setAppStep('input');
    // userInputs is already preserved in state
  };

  const handleBackToPalettes = () => {
    setAppStep('paletteSelection');
    setStyleConcepts([]); // Clear old concepts to generate new ones
  };

  const renderContent = () => {
      const isLoading = appStep === 'loadingAnalysis' || appStep === 'loadingOutfits';
      
      if(isLoading) {
          return <Loader message={loadingMessage} />;
      }
      
      if (error) {
           return (
            <div className="text-center p-8 bg-red-900/50 rounded-lg animate-fade-in">
              <p className="text-red-400 text-xl mb-4">{error}</p>
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-pink-600 hover:bg-pink-700 rounded-lg font-bold transition-colors"
              >
                Start Over
              </button>
            </div>
          );
      }

      switch (appStep) {
          case 'input':
              return <StylingForm onSubmit={handleAnalysisSubmit} language={language} initialInputs={userInputs} />;
          case 'paletteSelection':
              return <PaletteSelectionDisplay palettes={stylePalettes} onSelect={handlePaletteSelection} onReset={handleReset} onBackToForm={handleBackToForm} language={language} userInputs={userInputs} />;
          case 'results':
              return <ResultsDisplay concepts={styleConcepts} onReset={handleReset} onBackToPalettes={handleBackToPalettes} language={language} />;
          default:
              return <StylingForm onSubmit={handleAnalysisSubmit} language={language} />;
      }
  }

  return (
    <div className="animate-fade-in">
      {renderContent()}
    </div>
  );
};