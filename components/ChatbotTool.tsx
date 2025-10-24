
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { Spinner } from './Spinner';
import type { ChatMessage } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const ChatbotTool: React.FC = () => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const newChat = ai.chats.create({
          model: 'gemini-2.5-flash',
          config: {
              systemInstruction: 'You are a helpful and friendly AI assistant named AI Spark. Your goal is to provide accurate and concise information to the user. You should communicate in Arabic.',
          },
      });
      setChat(newChat);
      setMessages([{role: 'model', text: 'أهلاً بك في AI Spark! أنا هنا لمساعدتك. كيف يمكنني خدمتك اليوم؟'}]);
    }, []);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = useCallback(async () => {
        if (!userInput.trim() || !chat) return;

        const userMessage: ChatMessage = { role: 'user', text: userInput };
        setMessages(prev => [...prev, userMessage]);
        setUserInput('');
        setIsLoading(true);
        setError('');

        try {
            const response = await chat.sendMessage({ message: userInput });
            const modelMessage: ChatMessage = { role: 'model', text: response.text.replace(/\*\*/g, '') };
            setMessages(prev => [...prev, modelMessage]);
        } catch (err) {
            console.error(err);
            let message = 'حدث خطأ أثناء التواصل مع المساعد. يرجى المحاولة مرة أخرى.';
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
            setMessages(prev => prev.slice(0, -1)); // Rollback user message on error

        } finally {
            setIsLoading(false);
        }

    }, [userInput, chat]);

    return (
        <div className="flex flex-col h-[70vh]">
            <h2 className="text-2xl font-bold text-center text-amber-500 dark:text-amber-400 mb-4">روبوت المحادثة</h2>
            
            <div ref={chatContainerRef} className="flex-grow bg-gray-50 dark:bg-slate-900/50 rounded-lg p-4 mb-4 overflow-y-auto border border-gray-200 dark:border-slate-700">
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xl p-3 rounded-lg ${msg.role === 'user' ? 'bg-orange-500 text-white rounded-br-none' : 'bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-slate-200 rounded-bl-none'}`}>
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="max-w-lg p-3 rounded-lg bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-slate-200 rounded-bl-none flex items-center">
                                <Spinner size={5}/>
                                <span className="ms-2">يفكر...</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {error && <p className="text-red-600 dark:text-red-400 text-center mb-2">{error}</p>}
            
            <div className="flex gap-2">
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                    placeholder="اكتب رسالتك هنا..."
                    className="flex-grow bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                />
                <button
                    onClick={handleSendMessage}
                    disabled={isLoading || !userInput.trim()}
                    className="bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 dark:disabled:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-all transform active:scale-95"
                >
                    إرسال
                </button>
            </div>
        </div>
    );
};
