
import React, { useState, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Spinner } from './Spinner';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const VideoSummarizerTool: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSummarize = useCallback(async () => {
        if (!topic.trim()) {
            setError('الرجاء إدخال عنوان الفيديو أو الموضوع.');
            return;
        }
        setIsLoading(true);
        setError('');
        setSummary('');

        try {
            const prompt = `يرجى تقديم ملخص مفصل على شكل نقاط لفيديو حول موضوع "${topic}". يجب أن يغطي الملخص الموضوعات الرئيسية والحجج الأساسية والنقاط الهامة كما لو كنت تلخص فيديو تعليميًا شاملاً. يجب أن يكون الملخص باللغة العربية.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            
            setSummary(response.text.replace(/\*\*/g, ''));
        } catch (err) {
            console.error(err);
            let message = 'حدث خطأ أثناء تلخيص الموضوع. الرجاء المحاولة مرة أخرى.';
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
    }, [topic]);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-amber-500 dark:text-amber-400">ملخص الفيديو الذكي</h2>
            <p className="text-center text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">أدخل عنوان فيديو أو موضوعاً، وسيقوم الذكاء الاصطناعي بتوليد ملخص لأهم النقاط الرئيسية لك. (ملاحظة: لا تتم معالجة الفيديو الفعلي، بل يتم تلخيص الموضوع المطلوب).</p>

            <div className="max-w-2xl mx-auto space-y-4">
                <div>
                    <label htmlFor="video-topic" className="block text-lg font-medium text-gray-700 dark:text-slate-300 mb-2">عنوان الفيديو أو الموضوع</label>
                    <textarea
                        id="video-topic"
                        rows={3}
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="مثال: شرح مبسط لنظرية النسبية لأينشتاين"
                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                    />
                </div>
                
                <button
                    onClick={handleSummarize}
                    disabled={isLoading}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all transform active:scale-95 flex justify-center items-center gap-3"
                >
                    {isLoading ? <Spinner /> : 'لخص الآن'}
                </button>
            </div>
            
            {error && <p className="text-red-600 dark:text-red-400 text-center mt-4">{error}</p>}

            {isLoading && (
                <div className="mt-6 flex justify-center">
                    <Spinner size={10} />
                </div>
            )}

            {summary && (
                <div className="mt-8 max-w-3xl mx-auto">
                     <div className="w-full p-4 bg-gray-100 dark:bg-slate-900/70 rounded-lg border border-gray-200 dark:border-slate-700">
                        <h3 className="text-xl font-semibold text-amber-600 dark:text-amber-400 mb-3">النقاط الرئيسية:</h3>
                        <p className="text-gray-700 dark:text-slate-300 whitespace-pre-wrap">{summary}</p>
                    </div>
                </div>
            )}
        </div>
    );
};
