
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Spinner } from './Spinner';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

interface GroundingChunk {
    web?: {
        uri: string;
        title: string;
    };
}

interface SearchChatMessage {
    role: 'user' | 'model';
    text: string;
    sources?: GroundingChunk[];
}

export const GoogleSearchTool: React.FC = () => {
    const [query, setQuery] = useState('');
    const [history, setHistory] = useState<SearchChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [history]);

    const handleSearch = useCallback(async () => {
        if (!query.trim()) {
            setError('الرجاء إدخال سؤال أو مصطلح بحث.');
            return;
        }

        const userMessage: SearchChatMessage = { role: 'user', text: query };
        setHistory(prev => [...prev, userMessage]);
        setQuery('');
        setIsLoading(true);
        setError('');

        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: query,
                config: {
                    tools: [{ googleSearch: {} }],
                },
            });

            const modelMessage: SearchChatMessage = {
                role: 'model',
                text: response.text.replace(/\*\*/g, ''),
                sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
            };
            setHistory(prev => [...prev, modelMessage]);

        } catch (err) {
            console.error(err);
            let message = 'حدث خطأ أثناء البحث. الرجاء المحاولة مرة أخرى.';
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
            setHistory(prev => prev.slice(0, -1)); // Rollback user message on error
        } finally {
            setIsLoading(false);
        }
    }, [query]);

    return (
        <div className="flex flex-col h-[70vh]">
            <h2 className="text-2xl font-bold text-center text-amber-500 dark:text-amber-400 mb-2">استخدام بيانات بحث Google</h2>
            <p className="text-center text-gray-600 dark:text-slate-400 mb-4 max-w-3xl mx-auto">احصل على إجابات مدعومة بأحدث نتائج بحث Google. مثالي لمناقشة الأحداث الجارية، والاستشهاد بأحدث الأخبار، أو التحقق من صحة المعلومات.</p>

            <div ref={chatContainerRef} className="flex-grow bg-gray-50 dark:bg-slate-900/50 rounded-lg p-4 mb-4 overflow-y-auto border border-gray-200 dark:border-slate-700">
                <div className="space-y-4">
                    {history.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-2xl p-3 rounded-lg ${msg.role === 'user' ? 'bg-orange-500 text-white rounded-br-none' : 'bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-slate-200 rounded-bl-none'}`}>
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                                {msg.role === 'model' && msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-4 border-t border-gray-300 dark:border-slate-600 pt-3">
                                        <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">المصادر:</h4>
                                        <ol className="list-decimal list-inside space-y-1">
                                            {msg.sources.filter(s => s.web).map((source, s_index) => (
                                                <li key={s_index}>
                                                    <a href={source.web!.uri} target="_blank" rel="noopener noreferrer" className="text-amber-600 dark:text-amber-400 hover:underline text-sm">
                                                        {source.web!.title || new URL(source.web!.uri).hostname}
                                                    </a>
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="max-w-lg p-3 rounded-lg bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-slate-200 rounded-bl-none flex items-center">
                                <Spinner size={5} />
                                <span className="ms-2">يبحث...</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {error && <p className="text-red-600 dark:text-red-400 text-center mb-2">{error}</p>}

            <div className="flex gap-2">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSearch()}
                    placeholder="اسأل عن الأحداث الجارية، الأخبار، أو أي شيء آخر..."
                    className="flex-grow bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                />
                <button
                    onClick={handleSearch}
                    disabled={isLoading || !query.trim()}
                    className="bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 dark:disabled:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-all transform active:scale-95"
                >
                    ابحث
                </button>
            </div>
        </div>
    );
};
