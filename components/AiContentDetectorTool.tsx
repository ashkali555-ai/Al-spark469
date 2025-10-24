
import React, { useState, useCallback } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Spinner } from './Spinner';
import { Bot, User } from 'lucide-react';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

interface AnalysisResult {
    prediction: 'AI' | 'Human';
    confidence: {
        ai: number;
        human: number;
    };
    indicators: string[];
}

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        prediction: { 
            type: Type.STRING,
            description: "The final prediction, either 'AI' or 'Human'."
        },
        confidence: {
            type: Type.OBJECT,
            properties: {
                ai: { type: Type.NUMBER, description: "Confidence score for AI from 0-100." },
                human: { type: Type.NUMBER, description: "Confidence score for Human from 0-100." }
            },
            required: ['ai', 'human']
        },
        indicators: {
            type: Type.ARRAY,
            items: { 
                type: Type.STRING,
                description: "A linguistic indicator that supports the prediction."
            },
            description: "A list of key linguistic indicators found in the text."
        }
    },
    required: ['prediction', 'confidence', 'indicators']
};


export const AiContentDetectorTool: React.FC = () => {
    const [text, setText] = useState('');
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAnalyze = useCallback(async () => {
        if (!text.trim()) {
            setError('الرجاء إدخال نص لتحليله.');
            return;
        }
        setIsLoading(true);
        setError('');
        setResult(null);

        try {
            const prompt = `
                As an expert in linguistic forensics and AI text analysis, your task is to determine if the following text was written by a human or an AI.

                Analyze the text based on these linguistic indicators:
                - AI Indicators: Statistical consistency, uniform sentence length, repetitive phrasing, overly neutral/formal tone, flawless grammar, lack of personal anecdotes or emotions.
                - Human Indicators: Variation in vocabulary and sentence structure, natural minor errors, colloquialisms, expression of emotions, personal experiences, a distinct voice, rhetorical devices, humor.
                
                Based on your analysis of the text provided below, return a JSON object with your findings, adhering to the provided schema. Provide the indicators in Arabic.

                TEXT TO ANALYZE:
                ---
                ${text}
                ---
            `;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: analysisSchema,
                },
            });
            
            const jsonResult = JSON.parse(response.text);
            setResult(jsonResult);
        } catch (err) {
            console.error(err);
            let message = 'حدث خطأ أثناء تحليل النص. قد يكون النص غير مدعوم أو حدث خطأ في الشبكة.';
            if (err instanceof Error) {
                const errorMessage = err.message.toLowerCase();
                if (errorMessage.includes('api key not valid')) {
                    message = 'مفتاح API غير صالح. يرجى التأكد من أنه تم إعداده بشكل صحيح.';
                } else if (errorMessage.includes('quota')) {
                    message = 'تم الوصول إلى الحد الأقصى للاستخدام (Quota). يرجى المحاولة مرة أخرى لاحقًا.';
                } else if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
                    message = 'حدث خطأ في الشبكة. يرجى التحقق من اتصالك بالإنترنت.';
                } else if (errorMessage.includes('invalid argument')) {
                    message = 'المدخلات غير صالحة أو أن النموذج لا يمكنه معالجة هذا النص. يرجى المحاولة مرة أخرى.';
                }
            }
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [text]);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-amber-500 dark:text-amber-400">كاشف محتوى الذكاء الاصطناعي</h2>
            <p className="text-center text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">هل تشك في أن النص مكتوب بواسطة الذكاء الاصطناعي؟ الصق النص هنا لتحليله وتحديد ما إذا كان من عمل إنسان أم آلة.</p>

            <div className="max-w-3xl mx-auto space-y-4">
                <div>
                    <label htmlFor="content-text" className="block text-lg font-medium text-gray-700 dark:text-slate-300 mb-2">النص المراد تحليله</label>
                    <textarea
                        id="content-text"
                        rows={10}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="الصق النص هنا..."
                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                    />
                </div>
                
                <button
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all transform active:scale-95 flex justify-center items-center gap-3"
                >
                    {isLoading ? <Spinner /> : 'تحليل النص'}
                </button>
            </div>
            
            {error && <p className="text-red-600 dark:text-red-400 text-center mt-4">{error}</p>}

            {isLoading && (
                <div className="mt-6 flex justify-center">
                    <Spinner size={10} />
                </div>
            )}

            {result && (
                <div className="mt-8 max-w-3xl mx-auto p-6 bg-gray-100 dark:bg-slate-900/70 rounded-lg border border-gray-200 dark:border-slate-700 space-y-6">
                    <h3 className="text-xl font-bold text-center text-amber-600 dark:text-amber-400">نتيجة التحليل</h3>
                    <div className="text-center text-2xl font-semibold">
                        <p>من المرجح أن هذا النص كتبه: 
                            <span className={`px-2 py-1 rounded-md ${result.prediction === 'AI' ? 'bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200' : 'bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200'}`}>
                                {result.prediction === 'AI' ? 'ذكاء اصطناعي' : 'إنسان'}
                            </span>
                        </p>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-lg font-medium text-red-600 dark:text-red-400 flex items-center"><Bot className="me-2" /> الذكاء الاصطناعي</span>
                                <span className="font-bold text-lg">{result.confidence.ai}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-4">
                                <div className="bg-red-500 h-4 rounded-full" style={{ width: `${result.confidence.ai}%` }}></div>
                            </div>
                        </div>
                         <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-lg font-medium text-green-600 dark:text-green-400 flex items-center"><User className="me-2"/> إنسان</span>
                                <span className="font-bold text-lg">{result.confidence.human}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-4">
                                <div className="bg-green-500 h-4 rounded-full" style={{ width: `${result.confidence.human}%` }}></div>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="text-lg font-semibold text-gray-800 dark:text-slate-200 mb-2">المؤشرات الرئيسية:</h4>
                        <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-slate-300">
                            {result.indicators.map((indicator, index) => (
                                <li key={index}>{indicator}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};
