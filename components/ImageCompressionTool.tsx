
import React, { useState, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Spinner } from './Spinner';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

export const ImageCompressionTool: React.FC = () => {
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [originalUrl, setOriginalUrl] = useState<string | null>(null);
    const [originalSize, setOriginalSize] = useState<number | null>(null);
    const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);
    const [enhancedSize, setEnhancedSize] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                setError('الرجاء اختيار ملف صورة صالح.');
                return;
            }
            setOriginalFile(file);
            setOriginalUrl(URL.createObjectURL(file));
            setOriginalSize(file.size);
            setEnhancedUrl(null);
            setEnhancedSize(null);
            setError('');
        }
    };

    const handleEnhance = useCallback(async () => {
        if (!originalFile) {
            setError('الرجاء تحميل صورة أولاً.');
            return;
        }
        setIsLoading(true);
        setError('');
        setEnhancedUrl(null);
        setEnhancedSize(null);

        try {
            const base64Data = await fileToBase64(originalFile);
            const imagePart = {
                inlineData: {
                    data: base64Data,
                    mimeType: originalFile.type,
                },
            };
            const textPart = {
                text: 'Enhance this image comprehensively. Improve colors to be more vibrant and natural, sharpen details for better clarity, remove any visible noise or artifacts, and optimize the file size without significant loss of quality. Return only the enhanced image.',
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [imagePart, textPart] },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });
            
            let finalImageUrl = '';
            let finalImageSize = 0;
            
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const enhancedBase64 = part.inlineData.data;
                    const mimeType = part.inlineData.mimeType;
                    finalImageUrl = `data:${mimeType};base64,${enhancedBase64}`;
                    
                    const blob = await(await fetch(finalImageUrl)).blob();
                    finalImageSize = blob.size;
                    
                    break;
                }
            }
            
            if (finalImageUrl) {
                setEnhancedUrl(finalImageUrl);
                setEnhancedSize(finalImageSize);
            } else {
                throw new Error("لم يتم إرجاع صورة محسنة من النموذج.");
            }

        } catch (err) {
            console.error(err);
            let message = 'حدث خطأ أثناء تحسين الصورة. الرجاء المحاولة مرة أخرى.';
            if (err instanceof Error) {
                const errorMessage = err.message.toLowerCase();
                if (errorMessage.includes('api key not valid')) {
                    message = 'مفتاح API غير صالح. يرجى التأكد من أنه تم إعداده بشكل صحيح.';
                } else if (errorMessage.includes('quota')) {
                    message = 'تم الوصول إلى الحد الأقصى للاستخدام (Quota). يرجى المحاولة مرة أخرى لاحقًا.';
                } else if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
                    message = 'حدث خطأ في الشبكة. يرجى التحقق من اتصالك بالإنترنت.';
                }
            }
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [originalFile]);
    
    const reductionPercentage = originalSize && enhancedSize ? ((originalSize - enhancedSize) / originalSize * 100).toFixed(1) : 0;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-amber-500 dark:text-amber-400">محسن الصور الذكي</h2>
            <p className="text-center text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">بلمسة واحدة، قم بتحسين جودة صورك. الأداة تقوم بتعزيز الألوان، زيادة الوضوح، إزالة التشويش، وضغط الحجم بذكاء.</p>
            
            <div className="flex flex-col items-center">
                <label htmlFor="image-enhance-upload" className="cursor-pointer bg-white dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 text-amber-600 dark:text-amber-400 font-bold py-2 px-4 rounded-lg border border-gray-300 dark:border-slate-600 transition-colors transform active:scale-95">
                    اختر صورة
                </label>
                <input id="image-enhance-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>

            {error && <p className="text-red-600 dark:text-red-400 text-center">{error}</p>}

            {originalFile && (
                <div className="space-y-6">
                    <div className="max-w-3xl mx-auto">
                         <button
                            onClick={handleEnhance}
                            disabled={isLoading}
                            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all transform active:scale-95 flex justify-center items-center gap-3"
                        >
                            {isLoading ? <><Spinner /> <span>جارٍ التحسين...</span></> : 'تحسين الصورة الآن'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start text-center">
                        <div className="p-4 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-lg">
                            <h4 className="text-lg font-bold text-gray-800 dark:text-slate-200 mb-2">الصورة الأصلية</h4>
                            <img src={originalUrl!} alt="Original" className="max-w-full h-auto max-h-80 rounded-lg shadow-md mx-auto" />
                            <p className="mt-3 font-semibold text-amber-600 dark:text-amber-400">الحجم: {formatBytes(originalSize!)}</p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-lg min-h-[200px] flex flex-col justify-center items-center">
                             <h4 className="text-lg font-bold text-gray-800 dark:text-slate-200 mb-2">الصورة المحسنة</h4>
                             {isLoading && <Spinner size={12} />}
                             {enhancedUrl && (
                                <>
                                    <img src={enhancedUrl} alt="Enhanced" className="max-w-full h-auto max-h-80 rounded-lg shadow-md mx-auto" />
                                    <p className="mt-3 font-semibold text-green-600 dark:text-green-400">الحجم الجديد: {formatBytes(enhancedSize!)}</p>
                                    <p className="font-semibold text-green-600 dark:text-green-400">نسبة التخفيض: {reductionPercentage}%</p>
                                    <a href={enhancedUrl} download={`enhanced-${originalFile.name}`} className="mt-4 inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-6 rounded-lg transition-colors transform active:scale-95">
                                        تحميل الصورة
                                    </a>
                                </>
                             )}
                             {!isLoading && !enhancedUrl && <p className="text-gray-500 dark:text-slate-400">اضغط على زر التحسين لرؤية النتيجة</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
