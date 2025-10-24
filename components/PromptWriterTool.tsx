
import React, { useState, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Spinner } from './Spinner';
import { Clipboard, Check } from 'lucide-react';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const targetTools = [
    { value: 'توليد صورة', label: 'توليد صورة' },
    { value: 'كتابة نص إبداعي', label: 'كتابة نص إبداعي' },
    { value: 'تلخيص نص', label: 'تلخيص نص' },
    { value: 'كتابة كود برمجي', label: 'كتابة كود برمجي' },
    { value: 'إجابة سؤال', label: 'إجابة سؤال' },
];

export const PromptWriterTool: React.FC = () => {
    const [idea, setIdea] = useState('');
    const [targetTool, setTargetTool] = useState('توليد صورة');
    const [generatedPrompt, setGeneratedPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    const generatePrompt = useCallback(async () => {
        if (!idea.trim()) {
            setError('الرجاء إدخال الفكرة الأساسية للبرومبت.');
            return;
        }
        setIsLoading(true);
        setError('');
        setGeneratedPrompt('');
        setIsCopied(false);

        try {
            const prompt = `بصفتك خبير في هندسة الأوامر (Prompt Engineering)، قم بتوسيع الفكرة التالية إلى برومبت مفصل وفعال مناسب لأداة ذكاء اصطناعي تستهدف "${targetTool}".
البرومبت يجب أن يكون واضحًا، محددًا، ويحتوي على تفاصيل كافية للحصول على أفضل النتائج الممكنة.
قدم البرومبت باللغة الإنجليزية ليكون متوافقًا مع معظم نماذج الذكاء الاصطناعي، مع إضافة ترجمته باللغة العربية أسفله.
الفكرة الأساسية هي: "${idea}"`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
            });
            
            setGeneratedPrompt(response.text.replace(/\*\*/g, ''));
        } catch (err) {
            console.error(err);
            let message = 'حدث خطأ أثناء إنشاء البرومبت. الرجاء المحاولة مرة أخرى.';
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
    }, [idea, targetTool]);

    const handleCopy = () => {
        if (generatedPrompt) {
            navigator.clipboard.writeText(generatedPrompt);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-amber-500 dark:text-amber-400">كاتب البرومبت الذكي</h2>
            <p className="text-center text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">هل تحتاج إلى برومبت فعال؟ أدخل فكرتك الأساسية، وسيقوم الذكاء الاصطناعي بتوسيعها إلى برومبت مفصل وقوي.</p>

            <div className="max-w-2xl mx-auto space-y-4">
                <div>
                    <label htmlFor="idea" className="block text-lg font-medium text-gray-700 dark:text-slate-300 mb-2">فكرتك الأساسية</label>
                    <textarea
                        id="idea"
                        rows={3}
                        value={idea}
                        onChange={(e) => setIdea(e.target.value)}
                        placeholder="مثال: قط يرتدي قبعة ساحر ويقرأ كتابًا في مكتبة قديمة"
                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                    />
                </div>
                
                <div>
                    <label htmlFor="target-tool" className="block text-lg font-medium text-gray-700 dark:text-slate-300 mb-2">الأداة المستهدفة</label>
                    <select
                        id="target-tool"
                        value={targetTool}
                        onChange={(e) => setTargetTool(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                    >
                        {targetTools.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>
                
                <button
                    onClick={generatePrompt}
                    disabled={isLoading}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all transform active:scale-95 flex justify-center items-center gap-3"
                >
                    {isLoading ? <Spinner /> : 'اكتب البرومبت'}
                </button>
            </div>
            
            {error && <p className="text-red-600 dark:text-red-400 text-center mt-4">{error}</p>}

            {isLoading && (
                <div className="mt-6 flex justify-center">
                    <Spinner size={10} />
                </div>
            )}

            {generatedPrompt && (
                <div className="mt-8 max-w-3xl mx-auto">
                     <div className="w-full p-4 bg-gray-100 dark:bg-slate-900/70 rounded-lg border border-gray-200 dark:border-slate-700 relative">
                        <h3 className="text-xl font-semibold text-amber-600 dark:text-amber-400 mb-3">البرومبت المقترح:</h3>
                        <button onClick={handleCopy} className="absolute top-3 left-3 p-2 bg-gray-200 dark:bg-slate-800 rounded-md hover:bg-gray-300 dark:hover:bg-slate-700 transition-colors">
                            {isCopied ? <Check className="text-green-500" size={18} /> : <Clipboard className="text-gray-600 dark:text-slate-300" size={18} />}
                        </button>
                        <p className="text-gray-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed pt-8">{generatedPrompt}</p>
                    </div>
                </div>
            )}
        </div>
    );
};
