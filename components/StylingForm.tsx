import React, { useState, useCallback, useEffect } from 'react';
import type { UserInputs, Language, PhotoInput } from '../types';
import { UploadIcon, InfoIcon, TrashIcon } from './IconComponents';

interface StylingFormProps {
  onSubmit: (inputs: UserInputs) => void;
  language: Language;
  initialInputs?: UserInputs | null;
}

const ageRanges = [
    { value: '', labelEn: 'Select an age range', labelAr: 'اختر فئة عمرية' },
    { value: 'Under 18', labelEn: 'Under 18', labelAr: 'أقل من 18' },
    { value: '18-25', labelEn: '18-25 years', labelAr: '18-25 سنة' },
    { value: '26-35', labelEn: '26-35 years', labelAr: '26-35 سنة' },
    { value: '36-45', labelEn: '36-45 years', labelAr: '36-45 سنة' },
    { value: '46-55', labelEn: '46-55 years', labelAr: '46-55 سنة' },
    { value: '56+', labelEn: '56+ years', labelAr: '56+ سنة' },
];

const translations: Record<Language, any> = {
    en: { title: "Create Your AI-Powered Style", subtitle: "Provide your details for a deep analysis and personalized style palettes.", upload: "Upload Your Photos (up to 3)", uploadDesc: "Front, side, and full-body photos work best.", gender: "Gender", male: "Male", female: "Female", other: "Other", occasion: "Occasion", occasionPlaceholder: "e.g., Wedding, Casual Brunch, Business Meeting", venue: "Venue (Optional)", venuePlaceholder: "e.g., Ballroom, fancy restaurant, outdoor park", country: "Country", countryPlaceholder: "e.g., United Arab Emirates", city: "City", cityPlaceholder: "e.g., Dubai", optional: "Optional Fields (More detail = better results!)", budget: "Budget (e.g., $500)", measurements: "Measurements (e.g., Size: M, Chest: 40in)", height: "Height (e.g., 5'10\" or 178cm)", style: "Style Preferences", stylePlaceholder: "e.g., Minimalist, Vintage, like specific accessories", ageRange: "Age Range", weather: "Current Weather", weatherPlaceholder: "e.g., Sunny and hot, 25°C", favoriteColors: "Favorite Colors", favoriteColorsPlaceholder: "e.g., Navy blue, beige, emerald green", favoriteBrands: "Favorite Brands", favoriteBrandsPlaceholder: "e.g., Zara, Chanel, Nike", inspiration: "Inspiration", inspirationDesc: "Upload photos of styles or items you like", bodyFocus: "Areas to Highlight or Downplay", bodyFocusPlaceholder: "e.g., 'I'd like to highlight my shoulders' or 'I prefer to downplay my midsection'.", weight: "Weight (e.g., 70 kg)", submit: "Analyze My Style" },
    ar: { title: "صمم ستايلك بالذكاء الاصطناعي", subtitle: "قدم تفاصيلك لتحليل عميق ولوحات ألوان مخصصة.", upload: "ارفع صورك (حتى 3)", uploadDesc: "صور أمامية وجانبية وكاملة للجسم تعمل بشكل أفضل.", gender: "الجنس", male: "ذكر", female: "أنثى", other: "آخر", occasion: "المناسبة", occasionPlaceholder: "مثال: حفل زفاف، غداء غير رسمي، اجتماع عمل", venue: "مكان المناسبة (اختياري)", venuePlaceholder: "مثال: قاعة أفراح، مطعم فاخر، حديقة خارجية", country: "الدولة", countryPlaceholder: "مثال: الإمارات العربية المتحدة", city: "المدينة", cityPlaceholder: "مثال: دبي", optional: "حقول اختيارية (تفاصيل أكثر = نتائج أفضل!)", budget: "الميزانية (مثال: 500 دولار)", measurements: "المقاسات (مثال: المقاس: M، الصدر: 102 سم)", height: "الطول (مثال: 178 سم)", style: "تفضيلات الستايل", stylePlaceholder: "مثال: بسيط، كلاسيكي، مع إكسسوارات معينة", ageRange: "الفئة العمرية", weather: "الطقس الحالي", weatherPlaceholder: "مثال: مشمس وحار، 25 درجة مئوية", favoriteColors: "الألوان المفضلة", favoriteColorsPlaceholder: "مثال: كحلي، بيج، أخضر زمردي", favoriteBrands: "الماركات المفضلة", favoriteBrandsPlaceholder: "مثال: Zara, Chanel, Nike", inspiration: "الإلهام", inspirationDesc: "ارفع صور ستايلات أو قطع تعجبك", bodyFocus: "مناطق لإبرازها أو إخفائها", bodyFocusPlaceholder: "مثال: 'أرغب في إبراز منطقة الأكتاف' أو 'أفضل عدم لفت الانتباه لمنطقة الخصر'.", weight: "الوزن (مثال: 70 كجم)", submit: "حلل ستايلي" },
    fr: { title: "Créez votre style avec l'IA", subtitle: "Fournissez vos détails pour une analyse approfondie et des palettes de style personnalisées.", upload: "Téléchargez vos photos (jusqu'à 3)", uploadDesc: "Les photos de face, de côté et en pied fonctionnent le mieux.", gender: "Genre", male: "Homme", female: "Femme", other: "Autre", occasion: "Occasion", occasionPlaceholder: "Ex: Mariage, Brunch décontracté, Réunion d'affaires", venue: "Lieu (Optionnel)", venuePlaceholder: "Ex: Salle de bal, restaurant chic, parc extérieur", country: "Pays", countryPlaceholder: "Ex: France", city: "Ville", cityPlaceholder: "Ex: Paris", optional: "Champs optionnels (Plus de détails = meilleurs résultats!)", budget: "Budget (ex: 500 €)", measurements: "Mensurations (ex: Taille: M, Poitrine: 102cm)", height: "Taille (ex: 1m78)", style: "Préférences de style", stylePlaceholder: "Ex: Minimaliste, Vintage, accessoires spécifiques", ageRange: "Tranche d'âge", weather: "Météo actuelle", weatherPlaceholder: "Ex: Ensoleillé et chaud, 25°C", favoriteColors: "Couleurs préférées", favoriteColorsPlaceholder: "Ex: Bleu marine, beige, vert émeraude", favoriteBrands: "Marques préférées", favoriteBrandsPlaceholder: "Ex: Zara, Chanel, Nike", inspiration: "Inspiration", inspirationDesc: "Téléchargez des photos de styles ou d'articles que vous aimez", bodyFocus: "Zones à mettre en valeur ou à atténuer", bodyFocusPlaceholder: "Ex: 'J'aimerais mettre en valeur mes épaules' ou 'Je préfère atténuer ma taille'.", weight: "Poids (ex: 70 kg)", submit: "Analyser mon style" },
    es: { title: "Crea tu estilo con IA", subtitle: "Proporciona tus datos para un análisis profundo y paletas de estilo personalizadas.", upload: "Sube tus fotos (hasta 3)", uploadDesc: "Las fotos de frente, de lado y de cuerpo entero funcionan mejor.", gender: "Género", male: "Hombre", female: "Mujer", other: "Otro", occasion: "Ocasión", occasionPlaceholder: "Ej: Boda, Brunch informal, Reunión de negocios", venue: "Lugar (Opcional)", venuePlaceholder: "Ej: Salón de baile, restaurante elegante, parque al aire libre", country: "País", countryPlaceholder: "Ej: España", city: "Ciudad", cityPlaceholder: "Ej: Madrid", optional: "Campos opcionales (¡Más detalles = mejores resultados!)", budget: "Presupuesto (ej: 500 €)", measurements: "Medidas (ej: Talla: M, Pecho: 102cm)", height: "Altura (ej: 1,78 m)", style: "Preferencias de estilo", stylePlaceholder: "Ej: Minimalista, Vintage, con accesorios específicos", ageRange: "Rango de edad", weather: "Clima actual", weatherPlaceholder: "Ej: Soleado y caluroso, 25°C", favoriteColors: "Colores favoritos", favoriteColorsPlaceholder: "Ej: Azul marino, beige, verde esmeralda", favoriteBrands: "Marcas favoritas", favoriteBrandsPlaceholder: "Ej: Zara, Chanel, Nike", inspiration: "Inspiración", inspirationDesc: "Sube fotos de estilos o artículos que te gusten", bodyFocus: "Áreas a resaltar o disimular", bodyFocusPlaceholder: "Ej: 'Me gustaría resaltar mis hombros' o 'Prefiero disimular mi sección media'.", weight: "Peso (ej: 70 kg)", submit: "Analizar mi estilo" },
    zh: { title: "使用AI打造您的风格", subtitle: "提供您的详细信息以进行深入分析和个性化风格调色板。", upload: "上传您的照片（最多3张）", uploadDesc: "正面、侧面和全身照片效果最佳。", gender: "性别", male: "男性", female: "女性", other: "其他", occasion: "场合", occasionPlaceholder: "例如：婚礼、休闲早午餐、商务会议", venue: "地点（可选）", venuePlaceholder: "例如：宴会厅、高级餐厅、室外公园", country: "国家", countryPlaceholder: "例如：中国", city: "城市", cityPlaceholder: "例如：北京", optional: "可选字段（更详细=更好的结果！）", budget: "预算（例如：¥3000）", measurements: "尺寸（例如：尺码：M，胸围：102厘米）", height: "身高（例如：178厘米）", style: "风格偏好", stylePlaceholder: "例如：极简主义、复古、喜欢特定配饰", ageRange: "年龄范围", weather: "当前天气", weatherPlaceholder: "例如：晴天炎热，25°C", favoriteColors: "喜欢的颜色", favoriteColorsPlaceholder: "例如：海军蓝、米色、翠绿色", favoriteBrands: "喜欢的品牌", favoriteBrandsPlaceholder: "例如：Zara、Chanel、Nike", inspiration: "灵感", inspirationDesc: "上传您喜欢的款式或物品的照片", bodyFocus: "突出或弱化的区域", bodyFocusPlaceholder: "例如：'我想突出我的肩膀'或'我更喜欢弱化我的腰部'。", weight: "体重（例如：70公斤）", submit: "分析我的风格" },
    hi: { title: "एआई-पावर्ड स्टाइल बनाएं", subtitle: "गहन विश्लेषण और व्यक्तिगत स्टाइल पैलेट के लिए अपना विवरण प्रदान करें।", upload: "अपनी तस्वीरें अपलोड करें (3 तक)", uploadDesc: "सामने, साइड और पूरे शरीर की तस्वीरें सबसे अच्छा काम करती हैं।", gender: "लिंग", male: "पुरुष", female: "महिला", other: "अन्य", occasion: "अवसर", occasionPlaceholder: "उदा., शादी, कैज़ुअल ब्रंच, बिजनेस मीटिंग", venue: "स्थान (वैकल्पिक)", venuePlaceholder: "उदा., बॉलरूम, फैंसी रेस्तरां, आउटडोर पार्क", country: "देश", countryPlaceholder: "उदा., भारत", city: "शहर", cityPlaceholder: "उदा., दिल्ली", optional: "वैकल्पिक फ़ील्ड (अधिक विवरण = बेहतर परिणाम!)", budget: "बजट (उदा., ₹20000)", measurements: "माप (उदा., आकार: M, छाती: 40 इंच)", height: "ऊंचाई (उदा., 5'10\" या 178 सेमी)", style: "स्टाइल प्राथमिकताएं", stylePlaceholder: "उदा., मिनिमलिस्ट, विंटेज, विशिष्ट एक्सेसरीज़ की तरह", ageRange: "आयु सीमा", weather: "वर्तमान मौसम", weatherPlaceholder: "उदा., धूप और गर्म, 25°C", favoriteColors: "पसंदीदा रंग", favoriteColorsPlaceholder: "उदा., नेवी ब्लू, बेज, एमरल्ड ग्रीन", favoriteBrands: "पसंदीदा ब्रांड", favoriteBrandsPlaceholder: "उदा., Zara, Chanel, Nike", inspiration: "प्रेरणा", inspirationDesc: "आपको पसंद आने वाली शैलियों या वस्तुओं की तस्वीरें अपलोड करें", bodyFocus: "उजागर करने या कम करने वाले क्षेत्र", bodyFocusPlaceholder: "उदा., 'मैं अपने कंधों को उजागर करना चाहूंगा' या 'मैं अपने मध्य भाग को कम करना पसंद करता हूं'。", weight: "वजन (उदा., 70 किग्रा)", submit: "मेरी शैली का विश्लेषण करें" },
};

interface PhotoFile {
    file: File;
    preview: string;
}

// Helper function to sanitize user input strings.
// This prevents malformed JSON when the model includes the string in its response.
const sanitizeInput = (value: string): string => {
    if (!value) return '';
    // 1. Replace newlines and tabs with a space to prevent breaking the prompt's structure.
    // 2. Escape double quotes to prevent JSON string termination.
    // 3. Trim whitespace from the start and end.
    return value.replace(/[\r\n\t]/g, ' ').replace(/"/g, '\\"').trim();
};

const fileToPhotoInput = (file: File): Promise<PhotoInput> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve({ base64, mimeType: file.type });
    };
    reader.onerror = (error) => reject(error);
  });

export const StylingForm: React.FC<StylingFormProps> = ({ onSubmit, language, initialInputs }) => {
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [inspirationPhotos, setInspirationPhotos] = useState<PhotoFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const t = translations[language] || translations.en;

  useEffect(() => {
    // Note: We can't pre-fill file inputs for security reasons.
    // Users will need to re-select photos if they go back.
    if (initialInputs) {
      console.log("Pre-filling form with initial inputs. Photos must be re-selected.");
    }
  }, [initialInputs]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isInspiration: boolean) => {
    const files = Array.from(e.target.files || []) as File[];
    if (!files.length) return;
    
    const targetArray = isInspiration ? inspirationPhotos : photos;
    const setter = isInspiration ? setInspirationPhotos : setPhotos;
    const limit = isInspiration ? 5 : 3;

    if (targetArray.length + files.length > limit) {
      setError(`You can upload a maximum of ${limit} photos.`);
      return;
    }

    files.forEach(file => {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        setError(`File ${file.name} is too large (max 4MB).`);
        return;
      }
    });

    const newPhotoFiles = files.map(file => ({ file, preview: URL.createObjectURL(file) }));
    setter([...targetArray, ...newPhotoFiles]);
    setError(null);
  };
  
  const removePhoto = (index: number, isInspiration: boolean) => {
      const setter = isInspiration ? setInspirationPhotos : setPhotos;
      setter(prev => prev.filter((_, i) => i !== index));
  }

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (photos.length === 0 && !initialInputs) { // Only require photos if it's the first submission
      setError('Please upload at least one photo of yourself.');
      return;
    }
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries()) as Record<string, string>;
    
    // Use existing photos if available, otherwise process new ones
    const photoInputs = photos.length > 0 
      ? await Promise.all(photos.map(p => fileToPhotoInput(p.file)))
      : initialInputs?.photos || [];
      
    if (photoInputs.length === 0) {
        setError('Please upload at least one photo of yourself.');
        return;
    }

    const inspirationInputs = await Promise.all(inspirationPhotos.map(p => fileToPhotoInput(p.file)));

    const inputs: UserInputs = {
      ...initialInputs, // Carry over old data like userDescription
      photos: photoInputs,
      inspirationPhotos: inspirationInputs.length > 0 ? inspirationInputs : initialInputs?.inspirationPhotos,
      occasion: sanitizeInput(data.occasion),
      venue: sanitizeInput(data.venue),
      country: sanitizeInput(data.country),
      city: sanitizeInput(data.city),
      gender: data.gender as UserInputs['gender'],
      budget: sanitizeInput(data.budget),
      measurements: sanitizeInput(data.measurements),
      height: sanitizeInput(data.height),
      stylePreferences: sanitizeInput(data.stylePreferences),
      ageRange: sanitizeInput(data.ageRange),
      weather: sanitizeInput(data.weather),
      favoriteColors: sanitizeInput(data.favoriteColors),
      favoriteBrands: sanitizeInput(data.favoriteBrands),
      bodyFocus: sanitizeInput(data.bodyFocus),
      weight: sanitizeInput(data.weight),
    };
    onSubmit(inputs);
  }, [photos, inspirationPhotos, onSubmit, initialInputs]);

  const PhotoUploader = ({ isInspiration = false }) => (
    <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">{isInspiration ? t.inspiration : t.upload} *</label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
            <div className="space-y-1 text-center">
                <UploadIcon />
                <div className="flex text-sm text-gray-500">
                    <label htmlFor={isInspiration ? "inspiration-upload" : "file-upload"} className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-pink-500 hover:text-pink-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 focus-within:ring-pink-500 px-1">
                        <span>Select files</span>
                        <input id={isInspiration ? "inspiration-upload" : "file-upload"} type="file" className="sr-only" multiple accept="image/png, image/jpeg, image/webp" onChange={(e) => handleFileChange(e, isInspiration)} />
                    </label>
                </div>
                <p className="text-xs text-gray-500">{isInspiration ? t.inspirationDesc : t.uploadDesc}</p>
            </div>
        </div>
         <p className="text-xs text-gray-500 mt-1">
            {initialInputs?.photos && photos.length === 0 ? "Previously uploaded photos are saved. Upload new ones to replace them." : ""}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
            {(isInspiration ? inspirationPhotos : photos).map((photo, index) => (
                <div key={index} className="relative">
                    <img src={photo.preview} alt={`Preview ${index}`} className="h-20 w-20 object-cover rounded-md"/>
                    <button type="button" onClick={() => removePhoto(index, isInspiration)} className="absolute top-0 right-0 bg-red-600/80 rounded-full p-0.5 text-white">
                        <TrashIcon />
                    </button>
                </div>
            ))}
        </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto bg-gray-800/50 p-6 md:p-10 rounded-2xl shadow-2xl shadow-violet-500/10 backdrop-blur-lg border border-gray-700">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-violet-400">{t.title}</h2>
        <p className="text-gray-400 mt-2">{t.subtitle}</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <PhotoUploader />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-700/50">
            {/* Gender, Occasion, Country, City */}
             <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-300">{t.gender} *</label>
              <select id="gender" name="gender" defaultValue={initialInputs?.gender || 'female'} required className="mt-1 block w-full pl-3 pr-10 py-2 bg-gray-700/50 border-gray-600 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm">
                <option value="female">{t.female}</option>
                <option value="male">{t.male}</option>
                <option value="other">{t.other}</option>
              </select>
            </div>
            <div>
                <label htmlFor="occasion" className="block text-sm font-medium text-gray-300">{t.occasion} *</label>
                <input type="text" name="occasion" id="occasion" defaultValue={initialInputs?.occasion || ''} required className="mt-1 block w-full bg-gray-700/50 border-gray-600 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm p-2" placeholder={t.occasionPlaceholder} />
            </div>
            <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-300">{t.country} *</label>
                <input type="text" name="country" id="country" defaultValue={initialInputs?.country || ''} required className="mt-1 block w-full bg-gray-700/50 border-gray-600 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm p-2" placeholder={t.countryPlaceholder} />
            </div>
            <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-300">{t.city} *</label>
                <input type="text" name="city" id="city" defaultValue={initialInputs?.city || ''} required className="mt-1 block w-full bg-gray-700/50 border-gray-600 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm p-2" placeholder={t.cityPlaceholder} />
            </div>
             <div className="md:col-span-2">
                <label htmlFor="venue" className="block text-sm font-medium text-gray-300">{t.venue}</label>
                <input type="text" name="venue" id="venue" defaultValue={initialInputs?.venue || ''} className="mt-1 block w-full bg-gray-700/50 border-gray-600 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm p-2" placeholder={t.venuePlaceholder} />
            </div>
        </div>

        <div className="pt-4 border-t border-gray-700/50">
            <h3 className="text-lg font-medium leading-6 text-gray-200 flex items-center gap-2"><InfoIcon /> {t.optional}</h3>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <PhotoUploader isInspiration={true} />
                <div /> 
                
                <div>
                    <label htmlFor="ageRange" className="block text-sm font-medium text-gray-300">{t.ageRange}</label>
                    <select id="ageRange" name="ageRange" defaultValue={initialInputs?.ageRange || ''} className="mt-1 block w-full pl-3 pr-10 py-2 bg-gray-700/50 border-gray-600 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm">
                        {ageRanges.map(range => (
                            <option key={range.value} value={range.value}>
                                {language === 'ar' ? range.labelAr : range.labelEn}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="weather" className="block text-sm font-medium text-gray-300">{t.weather}</label>
                    <input type="text" name="weather" id="weather" defaultValue={initialInputs?.weather || ''} className="mt-1 block w-full bg-gray-700/50 border-gray-600 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm p-2" placeholder={t.weatherPlaceholder} />
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="favoriteColors" className="block text-sm font-medium text-gray-300">{t.favoriteColors}</label>
                    <input type="text" name="favoriteColors" id="favoriteColors" defaultValue={initialInputs?.favoriteColors || ''} className="mt-1 block w-full bg-gray-700/50 border-gray-600 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm p-2" placeholder={t.favoriteColorsPlaceholder} />
                </div>
                 <div className="md:col-span-2">
                    <label htmlFor="favoriteBrands" className="block text-sm font-medium text-gray-300">{t.favoriteBrands}</label>
                    <input type="text" name="favoriteBrands" id="favoriteBrands" defaultValue={initialInputs?.favoriteBrands || ''} className="mt-1 block w-full bg-gray-700/50 border-gray-600 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm p-2" placeholder={t.favoriteBrandsPlaceholder} />
                </div>
                <div>
                    <label htmlFor="height" className="block text-sm font-medium text-gray-300">{t.height}</label>
                    <input type="text" name="height" id="height" defaultValue={initialInputs?.height || ''} className="mt-1 block w-full bg-gray-700/50 border-gray-600 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm p-2" placeholder={t.height} />
                </div>
                <div>
                    <label htmlFor="weight" className="block text-sm font-medium text-gray-300">{t.weight}</label>
                    <input type="text" name="weight" id="weight" defaultValue={initialInputs?.weight || ''} className="mt-1 block w-full bg-gray-700/50 border-gray-600 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm p-2" placeholder={t.weight} />
                </div>
                 <div>
                    <label htmlFor="measurements" className="block text-sm font-medium text-gray-300">{t.measurements}</label>
                    <input type="text" name="measurements" id="measurements" defaultValue={initialInputs?.measurements || ''} className="mt-1 block w-full bg-gray-700/50 border-gray-600 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm p-2" placeholder={t.measurements} />
                </div>
                <div>
                    <label htmlFor="budget" className="block text-sm font-medium text-gray-300">{t.budget}</label>
                    <input type="text" name="budget" id="budget" defaultValue={initialInputs?.budget || ''} className="mt-1 block w-full bg-gray-700/50 border-gray-600 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm p-2" placeholder="$500, 1000 AED, etc." />
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="bodyFocus" className="block text-sm font-medium text-gray-300">{t.bodyFocus}</label>
                    <textarea name="bodyFocus" id="bodyFocus" rows={3} defaultValue={initialInputs?.bodyFocus || ''} className="mt-1 block w-full bg-gray-700/50 border-gray-600 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm p-2" placeholder={t.bodyFocusPlaceholder}></textarea>
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="stylePreferences" className="block text-sm font-medium text-gray-300">{t.style}</label>
                    <textarea name="stylePreferences" id="stylePreferences" rows={3} defaultValue={initialInputs?.stylePreferences || ''} className="mt-1 block w-full bg-gray-700/50 border-gray-600 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm p-2" placeholder={t.stylePlaceholder}></textarea>
                </div>
            </div>
        </div>
        
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <div className="text-center pt-4">
            <button type="submit" className="w-full md:w-auto inline-flex justify-center py-3 px-12 border border-transparent shadow-lg text-base font-bold rounded-full text-white bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-pink-500 transition-transform transform hover:scale-105">
                {t.submit}
            </button>
        </div>
      </form>
    </div>
  );
};