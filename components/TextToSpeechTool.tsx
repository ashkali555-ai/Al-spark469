import React, { useState, useCallback, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Spinner } from './Spinner';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const voices = [
    { name: 'Kore', label: 'كور (أنثى)' },
    { name: 'Puck', label: 'باك (ذكر)' },
    { name: 'Charon', label: 'شارون (ذكر)' },
    { name: 'Fenrir', label: 'فنرير (أنثى)' },
    { name: 'Zephyr', label: 'زفير (ذكر)' },
];

const emotions = [
    { value: 'none', label: 'عادي' },
    { value: 'cheerfully', label: 'مبتهج' },
    { value: 'sadly', label: 'حزين' },
    { value: 'angrily', label: 'غاضب' },
    { value: 'excitedly', label: 'متحمس' },
    { value: 'calmly', label: 'هادئ' },
];


function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}


export const TextToSpeechTool: React.FC = () => {
    const [text, setText] = useState('');
    const [voice, setVoice] = useState('Kore');
    const [emotion, setEmotion] = useState('none');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    const audioContextRef = useRef<AudioContext | null>(null);

    const generateSpeech = useCallback(async () => {
        if (!text.trim()) {
            setError('الرجاء إدخال نص لتحويله.');
            return;
        }
        setIsLoading(true);
        setError('');
        setAudioUrl(null);

        try {
            const promptText = emotion === 'none' ? text : `Say it ${emotion}: ${text}`;
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-preview-tts',
                contents: [{ parts: [{ text: promptText }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: voice },
                        },
                    },
                },
            });
            
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                if(!audioContextRef.current || audioContextRef.current.state === 'closed'){
                    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                }
                const audioContext = audioContextRef.current;
                const audioBytes = decode(base64Audio);
                const audioBuffer = await decodeAudioData(audioBytes, audioContext, 24000, 1);
                
                const source = audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContext.destination);
                source.start();

                // Create a downloadable link
                const blob = new Blob([audioBytes], { type: 'audio/wav' });
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);

            } else {
                throw new Error("No audio data received.");
            }
        } catch (err) {
            console.error(err);
            let message = 'حدث خطأ أثناء توليد الصوت. الرجاء المحاولة مرة أخرى.';
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
    }, [text, voice, emotion]);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-amber-500 dark:text-amber-400">أداة تحويل النص إلى صوت</h2>
            <p className="text-center text-gray-600 dark:text-slate-400">حوّل أي نص مكتوب إلى صوت طبيعي عالي الجودة. اختر الصوت والنبرة التي تفضلها واستمع.</p>

            <div className="max-w-2xl mx-auto space-y-4">
                <div>
                    <label htmlFor="tts-text" className="block text-lg font-medium text-gray-700 dark:text-slate-300 mb-2">النص المراد تحويله</label>
                    <textarea
                        id="tts-text"
                        rows={6}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="اكتب النص هنا..."
                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="voice-select" className="block text-lg font-medium text-gray-700 dark:text-slate-300 mb-2">اختر الصوت</label>
                        <select
                            id="voice-select"
                            value={voice}
                            onChange={(e) => setVoice(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                        >
                            {voices.map(v => <option key={v.name} value={v.name}>{v.label}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="emotion-select" className="block text-lg font-medium text-gray-700 dark:text-slate-300 mb-2">اختر نبرة الصوت</label>
                        <select
                            id="emotion-select"
                            value={emotion}
                            onChange={(e) => setEmotion(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                        >
                            {emotions.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                        </select>
                    </div>
                </div>
                
                <button
                    onClick={generateSpeech}
                    disabled={isLoading}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all transform active:scale-95 flex justify-center items-center gap-3"
                >
                    {isLoading ? <Spinner /> : 'توليد الصوت والاستماع'}
                </button>

                {error && <p className="text-red-600 dark:text-red-400 text-center mt-4">{error}</p>}
                
                {audioUrl && (
                    <div className="mt-6 text-center bg-gray-100 dark:bg-slate-900/50 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                        <p className="text-lg text-green-600 dark:text-green-400 mb-2">تم توليد الصوت بنجاح!</p>
                        <audio controls src={audioUrl} className="w-full">
                            Your browser does not support the audio element.
                        </audio>
                        <a href={audioUrl} download="generated-audio.wav" className="inline-block mt-4 text-amber-600 dark:text-amber-400 hover:underline">
                            تحميل الملف الصوتي
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};