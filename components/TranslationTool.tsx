
import React, { useState, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Spinner } from './Spinner';
import { Clipboard, Check, ArrowRightLeft } from 'lucide-react';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const languages = [
    { code: 'auto', name: 'اكتشاف تلقائي' },
    { code: 'ar', name: 'العربية' },
    { code: 'en', name: 'الإنجليزية' },
    { code: 'fr', name: 'الفرنسية' },
    { code: 'es', name: 'الإسبانية' },
    { code: 'de', name: 'الألمانية' },
    { code: 'ru', name: 'الروسية' },
    { code: 'zh-CN', name: 'الصينية (المبسطة)' },
    { code: 'ja', name: 'اليابانية' },
    { code: 'ko', name: 'الكورية' },
    { code: 'tr', name: 'التركية' },
    { code: 'hi', name: 'الهندية' },
];

export const TranslationTool: React.FC = () => {
    const [sourceText, setSourceText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [sourceLang, setSourceLang] = useState('auto');
    const [targetLang, setTargetLang] = useState('ar');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    const handleTranslate = useCallback(async () => {
        if (!sourceText.trim()) {
            setError('الرجاء إدخال نص للترجمة.');
            return;
        }
        if (sourceLang !== 'auto' && sourceLang === targetLang) {
            setError('لغة المصدر واللغة الهدف يجب أن تكونا مختلفتين.');
            return;
        }
        setIsLoading(true);
        setError('');
        setTranslatedText('');
        setIsCopied(false);

        try {
            const sourceLangName = languages.find(l => l.code === sourceLang)?.name || 'auto-detect';
            const targetLangName = languages.find(l => l.code === targetLang)?.name;

            const prompt = `Translate the following text from ${sourceLangName} to ${targetLangName}.
            Provide only the translated text, without any additional comments, explanations, or introductory phrases.
            Do not include the language name in the response.
            
            Text to translate:
            ---
            ${sourceText}
            ---
            `;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            
            setTranslatedText(response.text.trim());
        } catch (err) {
            console.error(err);
            let message = 'حدث خطأ أثناء الترجمة. الرجاء المحاولة مرة أخرى.';
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
    }, [sourceText, sourceLang, targetLang]);

    const handleCopy = () => {
        if (translatedText) {
            navigator.clipboard.writeText(translatedText);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const handleSwapLanguages = () => {
        if (sourceLang === 'auto') return; // Cannot swap with auto-detect
        setSourceLang(targetLang);
        setTargetLang(sourceLang);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-amber-500 dark:text-amber-400">أداة الترجمة الفورية</h2>
            <p className="text-center text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">ترجم النصوص بسهولة بين لغات متعددة. أدخل النص، اختر اللغات، واحصل على ترجمة دقيقة.</p>

            <div className="max-w-4xl mx-auto space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <textarea
                        value={sourceText}
                        onChange={(e) => setSourceText(e.target.value)}
                        placeholder="اكتب النص هنا..."
                        rows={8}
                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                    />
                    <div className="relative w-full h-full bg-gray-100 dark:bg-slate-900/70 border border-gray-200 dark:border-slate-700 rounded-lg p-3 min-h-[190px]">
                        <p className="whitespace-pre-wrap text-gray-800 dark:text-slate-200">{translatedText}</p>
                        {translatedText && (
                            <button onClick={handleCopy} className="absolute top-2 left-2 p-2 bg-gray-200 dark:bg-slate-800 rounded-md hover:bg-gray-300 dark:hover:bg-slate-700 transition-colors">
                                {isCopied ? <Check className="text-green-500" size={18} /> : <Clipboard className="text-gray-600 dark:text-slate-300" size={18} />}
                            </button>
                        )}
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <select
                        value={sourceLang}
                        onChange={(e) => setSourceLang(e.target.value)}
                        className="w-full sm:w-auto bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                    >
                        {languages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                    </select>
                    <button 
                        onClick={handleSwapLanguages} 
                        disabled={sourceLang === 'auto'}
                        className="p-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-full text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Swap languages"
                    >
                        <ArrowRightLeft size={20} />
                    </button>
                    <select
                        value={targetLang}
                        onChange={(e) => setTargetLang(e.target.value)}
                        className="w-full sm:w-auto bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                    >
                        {languages.filter(l => l.code !== 'auto').map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                    </select>
                </div>
                
                <button
                    onClick={handleTranslate}
                    disabled={isLoading}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all transform active:scale-95 flex justify-center items-center gap-3"
                >
                    {isLoading ? <Spinner /> : 'ترجم النص'}
                </button>
            </div>
            
            {error && <p className="text-red-600 dark:text-red-400 text-center mt-4">{error}</p>}

            {isLoading && !translatedText && (
                <div className="mt-6 flex justify-center">
                    <p className="text-gray-500 dark:text-slate-400 flex items-center gap-2"><Spinner size={6} /> جاري الترجمة...</p>
                </div>
            )}
        </div>
    );
};
