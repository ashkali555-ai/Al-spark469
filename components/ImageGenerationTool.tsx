
import React, { useState, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Spinner } from './Spinner';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const styles = [
    { value: 'realistic', label: 'واقعي' },
    { value: 'oil painting', label: 'لوحة زيتية' },
    { value: 'cartoon', label: 'كرتوني' },
    { value: 'digital art', label: 'فن رقمي' },
    { value: 'photorealistic', label: 'تصويري' },
    { value: 'fantasy', label: 'خيالي' },
];

const aspectRatios = [
    { value: '1:1', label: 'مربع (1:1)' },
    { value: '16:9', label: 'عرضي (16:9)' },
    { value: '9:16', label: 'طولي (9:16)' },
    { value: '4:3', label: 'شاشة (4:3)' },
    { value: '3:4', label: 'عمودي (3:4)' },
];

export const ImageGenerationTool: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [style, setStyle] = useState('digital art');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const generateImage = useCallback(async () => {
        if (!prompt) {
            setError('الرجاء إدخال وصف للصورة.');
            return;
        }
        setIsLoading(true);
        setError('');
        setGeneratedImage(null);

        try {
            const fullPrompt = `${prompt}, ${style} style`;
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: fullPrompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: aspectRatio,
                },
            });
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            setGeneratedImage(`data:image/jpeg;base64,${base64ImageBytes}`);
        } catch (err) {
            console.error(err);
            let message = 'حدث خطأ أثناء توليد الصورة. الرجاء المحاولة مرة أخرى.';
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
    }, [prompt, style, aspectRatio]);
    
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-amber-500 dark:text-amber-400">أداة توليد الصور بالذكاء الاصطناعي</h2>
            <p className="text-center text-gray-600 dark:text-slate-400">أطلق العنان لخيالك. اكتب وصفاً وسيقوم الذكاء الاصطناعي بتحويله إلى صورة فريدة.</p>
            
            <div className="max-w-2xl mx-auto space-y-4">
                <div>
                    <label htmlFor="prompt" className="block text-lg font-medium text-gray-700 dark:text-slate-300 mb-2">وصف الصورة (Prompt)</label>
                    <textarea
                        id="prompt"
                        rows={4}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="مثال: رائد فضاء يركب حصاناً مجنحاً على سطح المريخ"
                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                    />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="style" className="block text-lg font-medium text-gray-700 dark:text-slate-300 mb-2">النمط الفني</label>
                        <select
                            id="style"
                            value={style}
                            onChange={(e) => setStyle(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                        >
                            {styles.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="aspectRatio" className="block text-lg font-medium text-gray-700 dark:text-slate-300 mb-2">نسبة العرض للارتفاع</label>
                        <select
                            id="aspectRatio"
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value)}
                             className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                        >
                            {aspectRatios.map(ar => <option key={ar.value} value={ar.value}>{ar.label}</option>)}
                        </select>
                    </div>
                </div>
                
                <button
                    onClick={generateImage}
                    disabled={isLoading}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all transform active:scale-95 flex justify-center items-center gap-3"
                >
                    {isLoading ? <Spinner /> : 'توليد الصورة'}
                </button>
            </div>
            
             {error && <p className="text-red-600 dark:text-red-400 text-center mt-4">{error}</p>}

            <div className="mt-8 flex justify-center">
                {isLoading && (
                    <div className="w-full max-w-lg aspect-square bg-gray-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                        <Spinner size={16} />
                    </div>
                )}
                {generatedImage && (
                    <img src={generatedImage} alt="Generated art" className="max-w-full h-auto max-h-[70vh] rounded-lg shadow-lg shadow-black/10 dark:shadow-black/40" />
                )}
            </div>
        </div>
    );
};
