
import React, { useState, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Spinner } from './Spinner';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const tones = [
    { value: 'تعليمي', label: 'تعليمي' },
    { value: 'ترفيهي', label: 'ترفيهي' },
    { value: 'إحترافي/شركات', label: 'إحترافي/شركات' },
    { value: 'كوميدي', label: 'كوميدي' },
    { value: 'وثائقي', label: 'وثائقي' },
];

const durations = [
    { value: 'دقيقة واحدة', label: 'دقيقة واحدة (Short)' },
    { value: '3 دقائق', label: '3 دقائق (متوسط)' },
    { value: '5 دقائق', label: '5 دقائق (طويل)' },
];

export const VideoScriptGeneratorTool: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [tone, setTone] = useState('تعليمي');
    const [duration, setDuration] = useState('3 دقائق');
    const [script, setScript] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const generateScript = useCallback(async () => {
        if (!topic.trim()) {
            setError('الرجاء إدخال موضوع الفيديو.');
            return;
        }
        setIsLoading(true);
        setError('');
        setScript('');

        try {
            const prompt = `أنت كاتب سيناريو محترف. قم بكتابة سيناريو لفيديو مدته حوالي "${duration}" حول موضوع "${topic}" بأسلوب "${tone}". يجب أن يتضمن السيناريو تقسيمًا للمشاهد (Scene)، وصفًا مرئيًا (Visual)، والحوار أو التعليق الصوتي (Voiceover). قدم السيناريو باللغة العربية بشكل منظم وواضح.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
            });
            
            setScript(response.text.replace(/\*\*/g, ''));
        } catch (err) {
            console.error(err);
            let message = 'حدث خطأ أثناء إنشاء السيناريو. الرجاء المحاولة مرة أخرى.';
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
    }, [topic, tone, duration]);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-amber-500 dark:text-amber-400">كاتب سيناريو الفيديو</h2>
            <p className="text-center text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">هل لديك فكرة فيديو رائعة؟ أدخل الموضوع واختر النمط، وسيقوم الذكاء الاصطناعي بكتابة سيناريو احترافي لك.</p>

            <div className="max-w-2xl mx-auto space-y-4">
                <div>
                    <label htmlFor="video-topic" className="block text-lg font-medium text-gray-700 dark:text-slate-300 mb-2">موضوع الفيديو</label>
                    <textarea
                        id="video-topic"
                        rows={3}
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="مثال: كيف يعمل الذكاء الاصطناعي في حياتنا اليومية"
                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                    />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="tone" className="block text-lg font-medium text-gray-700 dark:text-slate-300 mb-2">النمط (Tone)</label>
                        <select
                            id="tone"
                            value={tone}
                            onChange={(e) => setTone(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                        >
                            {tones.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="duration" className="block text-lg font-medium text-gray-700 dark:text-slate-300 mb-2">المدة التقريبية</label>
                        <select
                            id="duration"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                             className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                        >
                            {durations.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                        </select>
                    </div>
                </div>
                
                <button
                    onClick={generateScript}
                    disabled={isLoading}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all transform active:scale-95 flex justify-center items-center gap-3"
                >
                    {isLoading ? <Spinner /> : 'أنشئ السيناريو'}
                </button>
            </div>
            
            {error && <p className="text-red-600 dark:text-red-400 text-center mt-4">{error}</p>}

            {isLoading && (
                <div className="mt-6 flex justify-center">
                    <Spinner size={10} />
                </div>
            )}

            {script && (
                <div className="mt-8 max-w-3xl mx-auto">
                     <div className="w-full p-4 bg-gray-100 dark:bg-slate-900/70 rounded-lg border border-gray-200 dark:border-slate-700">
                        <h3 className="text-xl font-semibold text-amber-600 dark:text-amber-400 mb-3">السيناريو المقترح:</h3>
                        <p className="text-gray-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{script}</p>
                    </div>
                </div>
            )}
        </div>
    );
};
