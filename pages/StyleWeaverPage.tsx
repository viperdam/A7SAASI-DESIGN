import React, { useState, useCallback, useEffect, useRef } from 'react';
import { StylingForm } from '../components/StylingForm';
import { ResultsDisplay } from '../components/ResultsDisplay';
import { PaletteSelectionDisplay } from '../components/PaletteSelectionDisplay';
import { Loader } from '../components/Loader';
import { AdGateModal } from '../components/AdGateModal';
import { analyzeStyleAndGeneratePalettes, generateSingleOutfitFromPalette, generateInitialImage } from '../services/geminiService';
import type { UserInputs, StyleConcept, StylePalette, Language, AppStep } from '../types';

interface StyleWeaverPageProps {
  language: Language;
}

const USER_PREFERENCES_KEY = 'a7sassi_weaver_prefs';

const outfitLoadingMessages = [
    "Analyzing your color profile...",
    "Sourcing unique items from thousands of stores...",
    "Creating hyper-realistic previews...",
    "Tailoring the perfect fit...",
    "Consulting with our AI stylists...",
    "Finalizing your personalized looks..."
];

export const StyleWeaverPage: React.FC<StyleWeaverPageProps> = ({ language }) => {
  const [appStep, setAppStep] = useState<AppStep>('input');
  const [userInputs, setUserInputs] = useState<UserInputs | null>(null);
  const [stylePalettes, setStylePalettes] = useState<StylePalette[]>([]);
  const [selectedPalette, setSelectedPalette] = useState<StylePalette | null>(null);
  const [styleConcepts, setStyleConcepts] = useState<StyleConcept[]>([]);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentPosition, setCurrentPosition] = useState<GeolocationPosition | undefined>(undefined);
  const [areResultsUnlocked, setAreResultsUnlocked] = useState<boolean>(false);
  const prevLangRef = useRef(language);
  const loadingIntervalRef = useRef<number | null>(null);

  // Load user preferences from localStorage on initial mount
  useEffect(() => {
    try {
        const savedPrefs = localStorage.getItem(USER_PREFERENCES_KEY);
        if (savedPrefs) {
            const parsedPrefs: UserInputs = JSON.parse(savedPrefs);
            // We only load preferences, not session-specific data like occasion or photos
            setUserInputs(current => ({...current, ...parsedPrefs}));
        }
    } catch (e) {
        console.error("Failed to load user preferences:", e);
        localStorage.removeItem(USER_PREFERENCES_KEY);
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => setCurrentPosition(position),
      (err) => console.warn(`Could not get geolocation: ${err.message}`)
    );
  }, []);
  
  // Cleanup interval on unmount
  useEffect(() => {
      return () => {
          if (loadingIntervalRef.current) {
              clearInterval(loadingIntervalRef.current);
          }
      };
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
                setError('We had trouble translating your palettes. Please check your connection and try again.');
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
      // Save preferences to localStorage (excluding session-specific fields)
      const { photos, inspirationPhotos, occasion, venue, ...prefsToSave } = inputs;
      localStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(prefsToSave));

      const { palettes, userDescription } = await analyzeStyleAndGeneratePalettes(inputs, language);
      setUserInputs(currentInputs => ({ ...currentInputs!, ...inputs, userDescription }));
      setStylePalettes(palettes);
      setAppStep('paletteSelection');
    } catch (err) {
      console.error(err);
      setError('An error occurred during style analysis. Please check your connection and try again.');
      setAppStep('input');
    } finally {
      setLoadingMessage('');
    }
  }, [language]);
  
  const generateOutfits = useCallback(async (palette: StylePalette) => {
      if (!userInputs || !userInputs.userDescription || !userInputs.photos) {
          setError('User inputs were lost. Please start over.');
          setAppStep('input');
          return;
      }

      setAppStep('loadingOutfits');
      setError(null);
      setStyleConcepts([]);
      
       // Start cycling through loading messages
      let messageIndex = 0;
      setLoadingMessage(outfitLoadingMessages[messageIndex]);
      loadingIntervalRef.current = window.setInterval(() => {
          messageIndex = (messageIndex + 1) % outfitLoadingMessages.length;
          setLoadingMessage(outfitLoadingMessages[messageIndex]);
      }, 3000);

      try {
        const generatedConcepts: StyleConcept[] = [];
        for (let i = 0; i < 3; i++) {
            const newConcept = await generateSingleOutfitFromPalette(userInputs, palette, language, currentPosition, generatedConcepts);
            generatedConcepts.push(newConcept);
        }

        const conceptsWithImages = [];
        for (let i = 0; i < generatedConcepts.length; i++) {
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
          setError('We had trouble creating outfits for that theme. Please try selecting a different style palette or check your connection.');
          setAppStep('paletteSelection');
      } finally {
          if (loadingIntervalRef.current) {
              clearInterval(loadingIntervalRef.current);
              loadingIntervalRef.current = null;
          }
          setLoadingMessage('');
      }
  }, [language, userInputs, currentPosition]);

  const handlePaletteSelection = useCallback((palette: StylePalette) => {
    setSelectedPalette(palette);
    if (areResultsUnlocked) {
        generateOutfits(palette);
    } else {
        setAppStep('adGate');
    }
  }, [areResultsUnlocked, generateOutfits]);

  const handleWatchAd = useCallback(() => {
      setAreResultsUnlocked(true);
      if (selectedPalette) {
          generateOutfits(selectedPalette);
      } else {
          setError("Something went wrong. Please select a palette again.");
          setAppStep('paletteSelection');
      }
  }, [selectedPalette, generateOutfits]);


  const handleReset = () => {
    setAppStep('input');
    const savedPrefs = userInputs ? (JSON.parse(localStorage.getItem(USER_PREFERENCES_KEY) || '{}')) : null;
    setUserInputs(savedPrefs);
    setStyleConcepts([]);
    setStylePalettes([]);
    setSelectedPalette(null);
    setError(null);
    setAreResultsUnlocked(false); // Reset the monetization gate
  };
  
  const handleClearPreferences = () => {
    localStorage.removeItem(USER_PREFERENCES_KEY);
    setUserInputs(null); 
    alert("Your saved preferences have been cleared.");
  };

  const handleBackToForm = () => {
    setAppStep('input');
  };

  const handleBackToPalettes = () => {
    setAppStep('paletteSelection');
    setStyleConcepts([]);
  };
  
  const handleCloseAdGate = () => {
    setAppStep('paletteSelection');
    setSelectedPalette(null);
  }

  const renderContent = () => {
      const isLoading = appStep === 'loadingAnalysis' || appStep === 'loadingOutfits';
      
      if(isLoading) {
          return <Loader message={loadingMessage} />;
      }

      if (appStep === 'adGate') {
          return <AdGateModal onWatchAd={handleWatchAd} onClose={handleCloseAdGate} language={language} />;
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
              return <StylingForm onSubmit={handleAnalysisSubmit} language={language} initialInputs={userInputs} onClearPreferences={handleClearPreferences} />;
          case 'paletteSelection':
              return <PaletteSelectionDisplay palettes={stylePalettes} onSelect={handlePaletteSelection} onReset={handleReset} onBackToForm={handleBackToForm} language={language} userInputs={userInputs} />;
          case 'results':
              return <ResultsDisplay concepts={styleConcepts} onReset={handleReset} onBackToPalettes={handleBackToPalettes} language={language} />;
          default:
              return <StylingForm onSubmit={handleAnalysisSubmit} language={language} onClearPreferences={handleClearPreferences} />;
      }
  }

  return (
    <div className="animate-fade-in">
      {renderContent()}
    </div>
  );
};