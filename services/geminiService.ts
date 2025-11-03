import { GoogleGenAI, Modality, Chat, Part, Type } from "@google/genai";
import type { UserInputs, StyleConcept, StylePalette, Language, PhotoInput } from '../types';

const getAIClient = () => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
}

const parseJsonResponse = <T>(text: string): T => {
    let jsonText = text.trim();

    // NEW: Check for and remove BOM (Byte Order Mark) which can cause parsing errors.
    if (jsonText.charCodeAt(0) === 0xFEFF) {
        jsonText = jsonText.slice(1);
    }

    // 1. Extract JSON from markdown block
    const jsonMatch = jsonText.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch && jsonMatch[1]) {
      jsonText = jsonMatch[1].trim();
    }
    
    // 2. Find the main JSON object/array boundaries to remove extraneous trailing characters.
    const firstBrace = jsonText.indexOf('{');
    const firstBracket = jsonText.indexOf('[');
    let startIndex = -1;

    if (firstBrace === -1 && firstBracket === -1) {
        // Fallback for cases where the response might be just the error message string
        // or not JSON at all. We will let the final parser handle it.
    } else {
        if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
            startIndex = firstBrace;
        } else {
            startIndex = firstBracket;
        }
    }

    if (startIndex !== -1) {
        const startChar = jsonText[startIndex];
        const endChar = startChar === '{' ? '}' : ']';
        let count = 1;
        let endIndex = -1;

        for (let i = startIndex + 1; i < jsonText.length; i++) {
            if (jsonText[i] === startChar) {
                count++;
            } else if (jsonText[i] === endChar) {
                count--;
            }
            if (count === 0) {
                endIndex = i;
                break;
            }
        }

        if (endIndex !== -1) {
            jsonText = jsonText.substring(startIndex, endIndex + 1);
        }
    }
    
    // 3. Clean invalid control characters. This includes standard ASCII control characters,
    //    Unicode bidirectional formatting characters (like RTL/LTR marks), and other
    //    invisible format-specifiers that can corrupt the JSON structure.
    let cleanedJsonText = jsonText.replace(/[\u0000-\u001f\u007f-\u009f\u2000-\u200f\u2028-\u202f\u205f-\u206f\ufeff]/g, '');


    // 4. Attempt to repair common JSON syntax errors.
    let repairedJson = cleanedJsonText;
    try {
        // Fix #1 (IMPROVED): Missing commas after objects or arrays.
        // This looks for a closing brace or bracket, followed by an opening brace or quote,
        // and inserts the required comma.
        repairedJson = repairedJson.replace(/([}\]])\s*([{"])/g, '$1,$2');
        
        // Fix #2: Missing commas between a string property and the next property. Handles any whitespace.
        repairedJson = repairedJson.replace(/(")\s+(")/g, '$1,$2');

        // Fix #3: Trailing commas before a closing bracket or brace.
        repairedJson = repairedJson.replace(/,\s*([}\]])/g, '$1');

    } catch (repairError) {
        console.error("A non-critical error occurred during the JSON repair attempt. This is unexpected but the process will continue.", repairError);
        repairedJson = cleanedJsonText; // Fallback to the pre-repair version if something goes wrong
    }

    try {
        // 5. Parse the repaired and sanitized JSON
        return JSON.parse(repairedJson) as T;
    } catch (e) {
        console.error("Failed to parse JSON response even after repair attempts:", repairedJson);
        console.error("Original parsing error:", e);
        throw new Error("Invalid JSON format received from the API, and automatic repair failed.");
    }
}


export const analyzeStyleAndGeneratePalettes = async (inputs: UserInputs, language: string): Promise<{ palettes: StylePalette[]; userDescription: string; }> => {
    const ai = getAIClient();
    const langMap: { [key: string]: string } = { en: 'English', ar: 'Arabic', fr: 'French', es: 'Spanish', zh: 'Chinese', hi: 'Hindi' };
    
    const today = new Date();
    const formatDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const currentDateStr = formatDate(today);

    const prompt = `
      You are an expert AI fashion analyst specializing in the IASC 12-season color system. Your task is to analyze the user's photos and data to produce a detailed analysis and four distinct style palettes. The entire output must be in ${langMap[language]}.

      **Analysis Steps:**
      1.  **User Feature Analysis:** From the user's photos, determine their skin tone (including undertone), hair color, and eye color.
      2.  **IASC Season Identification:** Based on the features, identify the user's dominant and secondary traits (e.g., Dark, Warm, Muted) and conclude their IASC 12-season category.
      3.  **Detailed Physical Description:** Synthesize all visual information (photos) and provided data (height, weight, etc.) into a comprehensive 'userDescription' string. This description must be highly detailed, capturing face shape, specific skin/hair/eye tones, body shape, and any distinctive features. This is critical for generating accurate images later.
      4.  **Generate Four Palettes:** Create four distinct palettes based on your analysis:
          -   **Palette 1 (Default):** Based directly on the identified IASC season. The description should explain the reasoning behind the season choice, referencing the user's features.
          -   **Palette 2 (Occasion):** Tailored to the user's occasion: '${inputs.occasion}'. This palette must be harmonious with their main IASC season.
          -   **Palette 3 (Trend):** A modern palette based on current fashion trends (${currentDateStr}) that complements the user's IASC season.
          -   **Palette 4 (Personalized):** A unique palette that merges the user's IASC season with their stated style preferences and favorite colors.
      5.  **Populate All Fields:** For each palette, provide a rich description, core colors, 'wow' colors, celebrity examples, and practical style/grooming tips. The 'pdfContent' fields should be populated with well-written, structured content suitable for a formal report.

      **User Data:**
      - Gender: ${inputs.gender}, Age: ${inputs.ageRange || 'N/A'}, Occasion: ${inputs.occasion}
      - Location: ${inputs.city}, ${inputs.country}, Weather: ${inputs.weather || 'N/A'}
      - Preferences: ${inputs.stylePreferences || 'N/A'}, Favorite Colors: ${inputs.favoriteColors || 'N/A'}
      - Body Details: Height: ${inputs.height || 'N/A'}, Weight: ${inputs.weight || 'N/A'}, Body Focus: ${inputs.bodyFocus || 'N/A'}

      Your final output will be structured according to the provided JSON schema. Ensure all text is in ${langMap[language]}.
    `;
    
    const paletteSchema = {
      type: Type.OBJECT,
      properties: {
        userDescription: { type: Type.STRING },
        palettes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              paletteName: { type: Type.STRING },
              isDefault: { type: Type.BOOLEAN },
              description: { type: Type.STRING },
              colorPalette: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { name: { type: Type.STRING }, hex: { type: Type.STRING } },
                  required: ['name', 'hex'],
                },
              },
              wowColors: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { name: { type: Type.STRING }, hex: { type: Type.STRING } },
                  required: ['name', 'hex'],
                },
              },
              styleTips: { type: Type.STRING },
              celebrityExamples: { type: Type.ARRAY, items: { type: Type.STRING } },
              pdfContent: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  introduction: { type: Type.STRING },
                  sections: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: { title: { type: Type.STRING }, content: { type: Type.STRING } },
                      required: ['title', 'content'],
                    },
                  },
                },
                required: ['title', 'introduction', 'sections'],
              },
            },
            required: ['paletteName', 'isDefault', 'description', 'colorPalette', 'wowColors', 'styleTips', 'celebrityExamples', 'pdfContent'],
          },
        },
      },
      required: ['userDescription', 'palettes'],
    };
    
    try {
        const parts: Part[] = [{ text: prompt }];
        inputs.photos.forEach(p => parts.push({ inlineData: { mimeType: p.mimeType, data: p.base64 } }));
        if(inputs.inspirationPhotos) {
            inputs.inspirationPhotos.forEach(p => parts.push({ inlineData: { mimeType: p.mimeType, data: p.base64 } }));
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts },
            config: {
                thinkingConfig: { thinkingBudget: 32768 },
                responseMimeType: "application/json",
                responseSchema: paletteSchema,
            },
        });
        
        if (!response || !response.text) {
            const blockReason = response?.promptFeedback?.blockReason;
            throw new Error(`Failed to get a valid response from the API. Reason: ${blockReason || 'Unknown'}.`);
        }

        try {
            // Use our robust parser just in case, though with JSON mode it should be clean
            return parseJsonResponse<{ palettes: StylePalette[]; userDescription: string }>(response.text);
        } catch (e) {
            console.error("Failed to parse guaranteed JSON response:", response.text);
            console.error("Original parsing error:", e);
            throw new Error("Invalid JSON format received from the API, even with JSON mode enabled.");
        }

    } catch (error) {
        console.error("Error in analyzeStyleAndGeneratePalettes:", error);
        throw new Error("Failed to generate style palettes from the API.");
    }
}


export const generateSingleOutfitFromPalette = async (inputs: UserInputs, selectedPalette: StylePalette, language: string, currentPosition?: GeolocationPosition, existingConcepts: StyleConcept[] = []): Promise<StyleConcept> => {
  const ai = getAIClient();
  const langMap: { [key: string]: string } = {
    en: 'English', ar: 'Arabic', fr: 'French', es: 'Spanish', zh: 'Chinese', hi: 'Hindi'
  };

  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const formatDate = (date: Date): string => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  
  const searchStartDateStr = formatDate(thirtyDaysAgo);

  const prompt = `
    You are a world-class AI fashion stylist and a hyper-realistic personal shopper. Your goal is to create **ONE** distinct, **100% shoppable** style concept based on a pre-defined style palette, adhering strictly to all user constraints.
    The final output MUST be in ${langMap[language]}.

    **CRITICAL CONTEXT (DO NOT DEVIATE):**
    -   **User Profile & Occasion:**
        -   Gender: ${inputs.gender}, Occasion: ${inputs.occasion}, Location: ${inputs.city}, ${inputs.country}
        -   **Reference Photos:** One or more photos of the user are provided as image input for visual analysis.
        -   **Physical Description (from initial analysis):** ${inputs.userDescription}
    -   **MANDATORY USER CONSTRAINTS (MUST BE FOLLOWED):**
        -   **Body & Measurements:** Height: ${inputs.height || 'N/A'}, Weight: ${inputs.weight || 'N/A'}, Size/Measurements: ${inputs.measurements || 'N/A'}. You MUST suggest clothing cuts and styles that flatter these specific proportions.
        -   **Body Focus/Goals:** The user wants to '${inputs.bodyFocus || 'achieve a balanced and flattering silhouette'}'. You MUST select items and cuts that achieve this styling goal.
        -   **Style DNA:** The user's preferred style is '${inputs.stylePreferences || 'a chic and appropriate look for the occasion'}'. The final look MUST reflect this aesthetic.
        -   **Budget:** The user's budget is '${inputs.budget || 'not specified'}'. Your product search MUST be guided by this price point. Avoid luxury items if the budget is low.
    -   **THE CHOSEN STYLE PALETTE:**
        -   **Name:** ${selectedPalette.paletteName}
        -   **Core Colors (HEX):** ${selectedPalette.colorPalette.map(c => c.hex).join(', ')}
        -   **Description:** ${selectedPalette.description}
    -   **PREVIOUSLY GENERATED CONCEPTS (DO NOT REPEAT):**
        -   ${existingConcepts.length > 0 ? existingConcepts.map(c => `- ${c.conceptName}: ${c.description}`).join('\n') : 'None yet.'}
        
    Your task is to translate this analytical palette into **ONE COMPLETE, NEW, REAL-WORLD OUTFIT.**

    Follow this **strict, sequential process**:

    **STEP 1: HYPER-REALISTIC PRODUCT SOURCING & VERIFICATION (CRITICAL)**
    This is the most important step. You must find and verify actual products that **perfectly match the colors, vibe of the chosen Style Palette, and user's budget.**
    1.  **Targeted Product Search:** Use Google Search to find specific product listings.
        -   **COLOR CONSTRAINT:** Your search queries MUST target the colors from the palette.
        -   **MANDATORY TIME FILTER:** You **MUST** use the \`after:\` operator with the date ${searchStartDateStr}. This is non-negotiable.
        -   **Location:** Source from e-commerce sites shipping to ${inputs.country} and use googleMaps for local boutiques in ${inputs.city} if geolocation is provided.
    2.  **MANDATORY LIVE VERIFICATION:** For **every single potential product URL**, perform a live verification.
        -   **Action:** Access the URL to analyze its live content.
        -   **Check Availability:** Look for "Add to Cart" or "In Stock". If it says "Out of Stock", **DISCARD this product immediately** and find an alternative.
        -   **Check Price:** Extract the current price and currency.

    **STEP 2: CONCEPT ASSEMBLY FROM VERIFIED PRODUCTS**
    Build **one distinct concept** using **only the real, available products you verified in STEP 1.** The concept must be a complete look (e.g., top, bottom, shoes, accessories).
    
    **STEP 3: GENERATE FINAL OUTPUT**
    1.  **Detailed Descriptions:** Write an inspiring and highly detailed narrative for the concept (at least 150 words), explaining how the items fit the palette, the user's constraints (body focus, style), and the occasion. Also, provide a comprehensive guide on complementary style tips (makeup or grooming).
    2.  **Image Prompt Generation:** Create a detailed, photorealistic image prompt. **DO NOT describe the person's physical features** (face, hair, skin, body type). The prompt must focus exclusively on:
        -   **The Clothes:** Clearly describe the specific, real items you listed.
        -   **The Scene:** Create a background/setting. **Crucially, if the user specified a venue ('${inputs.venue}'), you must use that for the scene.** Otherwise, create a setting appropriate for the occasion ('${inputs.occasion}'). The scene must be photorealistic.
        -   **Photographic Style:** Specify the aesthetic (e.g., 'fashion magazine style, sharp focus, dynamic pose, natural golden hour lighting, candid shot, taken with a 50mm lens').
    3.  **JSON Formatting:** Return the output as a single JSON object inside a markdown code block. The JSON must be perfectly valid.

    The JSON object must follow this exact structure:
    \`\`\`json
    {
      "conceptName": "string",
      "description": "An inspiring and highly detailed narrative of at least 150 words.",
      "items": [
        {
          "itemName": "First Item Name",
          "storeName": "Store A",
          "storeType": "online",
          "url": "https://example.com/item1",
          "price": "$100"
        }
      ],
      "styleTipsDescription": "A comprehensive and detailed guide on complementary makeup, beauty, or grooming.",
      "imagePrompt": "A detailed, photorealistic prompt describing the outfit, scene, and photographic style ONLY."
    }
    \`\`\`
  `;

  try {
    const parts: Part[] = [{ text: prompt }];
    if (inputs.photos) {
        inputs.photos.forEach(p => parts.push({ inlineData: { mimeType: p.mimeType, data: p.base64 } }));
    }
      
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: { parts },
      config: {
        tools: [{ googleSearch: {} }, { googleMaps: {} }],
        thinkingConfig: { thinkingBudget: 32768 },
        ...(currentPosition && { toolConfig: { retrievalConfig: { latLng: { latitude: currentPosition.coords.latitude, longitude: currentPosition.coords.longitude } } } }),
      },
    });
    
    if (!response || !response.text) {
        const blockReason = response?.promptFeedback?.blockReason;
        throw new Error(`Failed to get a valid response from the API. Reason: ${blockReason || 'Unknown'}.`);
    }
    
    const concept = parseJsonResponse<StyleConcept>(response.text);

    if (!concept) {
        throw new Error("API returned an empty object for the style concept.");
    }
    
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        concept.groundingChunks = response.candidates[0].groundingMetadata.groundingChunks;
    }

    return concept;
  } catch (error) {
    console.error("Error in generateSingleOutfitFromPalette:", error);
    throw new Error("Failed to generate a style concept from the API.");
  }
};

export const generateInitialImage = async (prompt: string, inputs: UserInputs): Promise<string> => {
  const ai = getAIClient();
  try {
    const sceneInstruction = inputs.venue 
      ? `The scene MUST be: '${inputs.venue}'. This is a strict requirement for the background.`
      : `The scene should be appropriate for the occasion: '${inputs.occasion}'.`;

    const masterPrompt = `
      Your task is to generate a single, hyper-realistic image of a specific person. Follow these instructions in order of priority. This is a strict, hierarchical process.

      **PRIORITY 1: ABSOLUTE FACIAL IDENTITY (NON-NEGOTIABLE)**
      - Your primary and most critical task is to use the provided reference image(s) to perfectly replicate the person's facial features, skin tone, hair style, and hair color.
      - The face in your generated image MUST BE an IDENTICAL LIKENESS to the face in the reference photos.
      - DO NOT alter the face in any way, even if you think it's to better match the body description. The face is the anchor and must remain unchanged.

      **PRIORITY 2: PRECISE PHYSICAL FORM**
      - Only after you have locked the facial identity, construct the person's body to PRECISELY match the following detailed description.
      - Do not use a generic body type. Recreate this specific physique with accuracy.
      ---
      ${inputs.userDescription}
      ---

      **PRIORITY 3: OUTFIT & SCENE**
      - Finally, dress the person (with the correct face and body) in the clothes described below and place them in the specified scene.
      ---
      ${prompt}
      ---
      **SCENE DIRECTIVE:** ${sceneInstruction}
    `;

    const parts: Part[] = [
      ...(inputs.photos || []).map(p => ({
        inlineData: { data: p.base64, mimeType: p.mimeType }
      })),
      { text: masterPrompt }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
      }
    }
    throw new Error("No image was returned from the reference photos.");
  } catch (error) {
    console.error("Error in generateInitialImage:", error);
    const width = 600;
    const height = 800;
    return `https://picsum.photos/seed/${Math.random()}/${width}/${height}`;
  }
};

export const editImage = async (base64ImageData: string, mimeType: string, prompt: string): Promise<string> => {
    const ai = getAIClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64ImageData,
                            mimeType: mimeType,
                        },
                    },
                    { text: prompt },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
            }
        }
        throw new Error("No edited image was returned.");
    } catch (error) {
        console.error("Error editing image:", error);
        throw new Error("Failed to edit the image.");
    }
};

export const generateVideo = async (prompt: string, image?: { base64: string, mimeType: string }, aspectRatio: '16:9' | '9:16' = '9:16') => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY }); 
    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        ...(image && { image: { imageBytes: image.base64, mimeType: image.mimeType } }),
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio
        }
    });
    
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000)); 
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }
    
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation completed but no download link was found.");
    }

    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!videoResponse.ok) {
        throw new Error("Failed to download the generated video.");
    }
    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);
};

export const createChat = (language: Language): Chat => {
    const ai = getAIClient();
    const langMap: { [key: string]: string } = {
        en: 'You are a friendly and deeply knowledgeable fashion AI assistant. Your goal is to provide detailed, comprehensive, insightful, and genuinely helpful answers. Never be brief; always be thorough and explain your reasoning.',
        ar: 'أنت مساعد ذكاء اصطناعي ودود وذو معرفة عميقة في عالم الموضة. هدفك هو تقديم إجابات مفصلة وشاملة وثاقبة ومفيدة حقًا. لا تكن موجزًا أبدًا؛ كن دائمًا شاملاً واشرح أسبابك.',
        fr: 'Vous êtes un assistant IA de mode amical et très compétent. Votre objectif est de fournir des réponses détaillées, complètes, perspicaces et véritablement utiles. Ne soyez jamais bref ; soyez toujours exhaustif et expliquez votre raisonnement.',
        es: 'Eres un asistente de IA de moda amigable y con un profundo conocimiento. Tu objetivo es proporcionar respuestas detalladas, completas, perspicaces y genuinamente útiles. Nunca seas breve; sé siempre minucioso y explica tu razonamiento.',
        zh: '你是一位友好且知识渊博的时尚AI助手。你的目标是提供详细、全面、有见地且真正有用的回答。绝不简短；始终要详尽并解释你的推理。',
        hi: 'आप एक दोस्ताना और गहरे जानकार फैशन एआई सहायक हैं। आपका लक्ष्य विस्तृत, व्यापक, व्यावहारिक और वास्तव में सहायक उत्तर प्रदान करना है। कभी भी संक्षिप्त न हों; हमेशा विस्तृत रहें और अपने तर्क की व्याख्या करें।',
    };

    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: langMap[language],
        },
    });
};