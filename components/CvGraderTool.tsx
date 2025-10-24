
import React, { useState, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Spinner } from './Spinner';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const CvGraderTool: React.FC = () => {
    const [resumeText, setResumeText] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [feedback, setFeedback] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGradeResume = useCallback(async () => {
        if (!resumeText.trim() || !jobTitle.trim()) {
            setError('الرجاء إدخال نص السيرة الذاتية والمسمى الوظيفي المستهدف.');
            return;
        }
        setIsLoading(true);
        setError('');
        setFeedback('');

        try {
            const prompt = `
                بصفتك خبير توظيف وخبير في كتابة السير الذاتية، قم بمراجعة السيرة الذاتية التالية للمتقدم لوظيفة "${jobTitle}".
                قدم ملاحظات بناءة ومفصلة باللغة العربية على شكل نقاط. ركز على:
                1.  **الصياغة واللغة**: هل الصياغة قوية واحترافية؟
                2.  **الكلمات المفتاحية**: هل تحتوي على كلمات مفتاحية ذات صلة بالوظيفة المستهدفة؟
                3.  **الفعالية الشاملة**: ما مدى فعالية السيرة الذاتية في إبراز نقاط قوة المرشح لهذه الوظيفة؟
                4.  **توصيات للتحسين**: قدم 3 توصيات محددة لتحسينها.

                ---
                **السيرة الذاتية:**
                ${resumeText}
                ---
            `;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            
            setFeedback(response.text.replace(/\*\*/g, ''));
        } catch (err) {
            console.error(err);
            let message = 'حدث خطأ أثناء مراجعة السيرة الذاتية. الرجاء المحاولة مرة أخرى.';
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
    }, [resumeText, jobTitle]);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-amber-500 dark:text-amber-400">مدقق السيرة الذاتية الذكي</h2>
            <p className="text-center text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">احصل على تحليل فوري لسيرتك الذاتية. الصق النص، حدد الوظيفة المستهدفة، ودع الذكاء الاصطناعي يقدم لك توصيات لتحسينها.</p>

            <div className="max-w-3xl mx-auto space-y-4">
                <div>
                    <label htmlFor="resume-text" className="block text-lg font-medium text-gray-700 dark:text-slate-300 mb-2">نص السيرة الذاتية (CV)</label>
                    <textarea
                        id="resume-text"
                        rows={10}
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        placeholder="الصق نص سيرتك الذاتية هنا..."
                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                    />
                </div>
                <div>
                    <label htmlFor="job-title" className="block text-lg font-medium text-gray-700 dark:text-slate-300 mb-2">المسمى الوظيفي المستهدف</label>
                    <input
                        id="job-title"
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="مثال: مطور واجهات أمامية، مدير تسويق"
                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                    />
                </div>
                
                <button
                    onClick={handleGradeResume}
                    disabled={isLoading}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all transform active:scale-95 flex justify-center items-center gap-3"
                >
                    {isLoading ? <Spinner /> : 'راجع سيرتي الذاتية'}
                </button>
            </div>
            
            {error && <p className="text-red-600 dark:text-red-400 text-center mt-4">{error}</p>}

            {isLoading && (
                <div className="mt-6 flex justify-center">
                    <Spinner size={10} />
                </div>
            )}

            {feedback && (
                <div className="mt-8 max-w-3xl mx-auto">
                     <div className="w-full p-4 bg-gray-100 dark:bg-slate-900/70 rounded-lg border border-gray-200 dark:border-slate-700">
                        <h3 className="text-xl font-semibold text-amber-600 dark:text-amber-400 mb-3">التحليل والتوصيات:</h3>
                        <div className="text-gray-700 dark:text-slate-300 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: feedback.replace(/\n/g, '<br />') }}></div>
                    </div>
                </div>
            )}
        </div>
    );
};
