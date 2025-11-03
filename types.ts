import type { Chat } from '@google/genai';

export type Language = 'en' | 'ar' | 'fr' | 'es' | 'zh' | 'hi';
export type ActivePage = 'weaver' | 'lab' | 'chat';
export type AppStep = 'input' | 'loadingAnalysis' | 'paletteSelection' | 'loadingOutfits' | 'results';

export interface PhotoInput {
  base64: string;
  mimeType: string;
}

export interface UserInputs {
  photos: PhotoInput[];
  inspirationPhotos?: PhotoInput[];
  occasion: string;
  venue?: string; // NEW: To specify the event location
  measurements?: string;
  country: string;
  city: string;
  budget?: string;
  stylePreferences?: string;
  gender: 'male' | 'female' | 'other';
  ageRange?: string;
  weather?: string;
  favoriteColors?: string;
  favoriteBrands?: string;
  bodyFocus?: string;
  height?: string; // NEW: More specific than just measurements
  weight?: string;
  userDescription?: string;
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
  maps?: {
    uri?: string;
    title?: string;
    placeAnswerSources?: {
        reviewSnippets?: {
            // FIX: Corrected properties to `uri` and `title` to resolve a type error from the Gemini API.
            // This aligns the type with other grounding chunk structures.
            uri?: string;
            title?: string;
        }[];
    }
  };
}

export interface Product {
  itemName: string;
  storeName: string;
  storeType: 'online' | 'local';
  url: string;
  price?: string;
}

export interface StyleConcept {
  conceptName: string;
  description: string;
  items: Product[];
  styleTipsDescription?: string;
  imagePrompt: string;
  imageUrl?: string;
  groundingChunks?: GroundingChunk[];
}

export interface StylePalette {
    paletteName: string;
    isDefault: boolean;
    description: string;
    colorPalette: { name: string; hex: string; }[];
    wowColors: { name: string; hex: string; }[];
    styleTips: string;
    celebrityExamples: string[];
    // This will contain structured text/markdown for PDF generation
    pdfContent: {
        title: string;
        introduction: string;
        sections: { title: string; content: string; }[];
    };
}


export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
    isStreaming?: boolean;
}

export type VideoGenerationState = 
  | 'idle' 
  | 'selecting_key' 
  | 'generating' 
  | 'polling' 
  | 'success' 
  | 'error';

// We need a type for the chat instance from the library
export type ChatInstance = Chat;