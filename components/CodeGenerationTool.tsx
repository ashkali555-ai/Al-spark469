
import React, { useState, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Spinner } from './Spinner';
import { Clipboard, Check } from 'lucide-react';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const languages = [
    { value: 'JavaScript', label: 'JavaScript' },
    { value: 'Python', label: 'Python' },
    { value: 'Java', label: 'Java' },
    { value: 'C++', label: 'C++' },
    { value: 'TypeScript', label: 'TypeScript' },
    { value: 'Go', label: 'Go' },
    { value: 'Rust', label: 'Rust' },
    { value: 'SQL', label: 'SQL' },
    { value: 'HTML/CSS', label: 'HTML/CSS' },
];


export const CodeGenerationTool: React.FC = () => {
    const [description, setDescription] = useState('');
    const [language, setLanguage] = useState('JavaScript');
    const [generatedCode, setGeneratedCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    const generateCode = useCallback(async () => {
        if (!description.trim()) {
            setError('الرجاء إدخال وصف للمهمة البرمجية.');
            return;
        }
        setIsLoading(true);
        setError('');
        setGeneratedCode('');
        setIsCopied(false);

        try {
            const prompt = `As an expert programmer, write a clean, efficient, and well-commented code snippet in ${language} for the following task: "${description}".
Provide only the code block, without any extra explanations or introductory text.
The code should be ready to be copied and used directly.
For example, if asked for a function, provide only the function definition.
Do not wrap the code in markdown backticks like \`\`\` language or \`\`\`.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
            });
            
            setGeneratedCode(response.text.trim());
        } catch (err) {
            console.error(err);
            let message = 'حدث خطأ أثناء إنشاء الكود. الرجاء المحاولة مرة أخرى.';
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
    }, [description, language]);

    const handleCopy = () => {
        if (generatedCode) {
            navigator.clipboard.writeText(generatedCode);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-amber-500 dark:text-amber-400">مولد الأكواد البرمجية</h2>
            <p className="text-center text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">صف المهمة التي تريدها بأي لغة، واختر لغة البرمجة، وسيقوم الذكاء الاصطناعي بكتابة الكود لك.</p>

            <div className="max-w-2xl mx-auto space-y-4">
                <div>
                    <label htmlFor="description" className="block text-lg font-medium text-gray-700 dark:text-slate-300 mb-2">وصف المهمة البرمجية</label>
                    <textarea
                        id="description"
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="مثال: دالة تقوم بترتيب مصفوفة من الأرقام تصاعدياً"
                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                    />
                </div>
                
                <div>
                    <label htmlFor="language" className="block text-lg font-medium text-gray-700 dark:text-slate-300 mb-2">لغة البرمجة</label>
                    <select
                        id="language"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                    >
                        {languages.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                </div>
                
                <button
                    onClick={generateCode}
                    disabled={isLoading}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all transform active:scale-95 flex justify-center items-center gap-3"
                >
                    {isLoading ? <Spinner /> : 'أنشئ الكود'}
                </button>
            </div>
            
            {error && <p className="text-red-600 dark:text-red-400 text-center mt-4">{error}</p>}

            {isLoading && (
                <div className="mt-6 flex justify-center">
                    <Spinner size={10} />
                </div>
            )}

            {generatedCode && (
                <div className="mt-8 max-w-4xl mx-auto">
                     <div className="bg-gray-900 rounded-lg relative group">
                        <button onClick={handleCopy} className="absolute top-3 right-3 p-2 bg-gray-700 rounded-md text-gray-300 hover:bg-gray-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100" aria-label="Copy code">
                            {isCopied ? <Check size={18} /> : <Clipboard size={18} />}
                        </button>
                        <pre className="p-4 text-left text-sm text-white overflow-x-auto rounded-lg" dir="ltr">
                            <code>
                                {generatedCode}
                            </code>
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
};
