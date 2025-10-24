import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, Volume2 } from 'lucide-react';

// Helper functions for audio encoding/decoding - MUST be defined locally.
function encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

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


const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const voices = [
    { name: 'Zephyr', label: 'زفير (ذكر - افتراضي)' },
    { name: 'Kore', label: 'كور (أنثى)' },
    { name: 'Puck', label: 'باك (ذكر)' },
    { name: 'Charon', label: 'شارون (ذكر)' },
    { name: 'Fenrir', label: 'فنرير (أنثى)' },
];

export const VoiceChatTool: React.FC = () => {
    const [isActive, setIsActive] = useState(false);
    const [isModelSpeaking, setIsModelSpeaking] = useState(false);
    const [userTranscript, setUserTranscript] = useState('');
    const [modelTranscript, setModelTranscript] = useState('');
    const [transcriptHistory, setTranscriptHistory] = useState<{ user: string, model: string }[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedVoice, setSelectedVoice] = useState('Zephyr');

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const playingSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    const stopConversation = useCallback(() => {
        setIsActive(false);
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (scriptProcessorRef.current && sourceRef.current && audioContextRef.current) {
            sourceRef.current.disconnect();
            scriptProcessorRef.current.disconnect();
            audioContextRef.current.close();
            scriptProcessorRef.current = null;
            sourceRef.current = null;
            audioContextRef.current = null;
        }
        
        if(outputAudioContextRef.current) {
            outputAudioContextRef.current.close();
            outputAudioContextRef.current = null;
        }

        playingSourcesRef.current.forEach(source => source.stop());
        playingSourcesRef.current.clear();

    }, []);
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        return () => {
            stopConversation();
        };
    }, []);

    const startConversation = async () => {
        setError(null);
        setTranscriptHistory([]);
        setUserTranscript('');
        setModelTranscript('');
        
        if (isActive) {
            stopConversation();
            return;
        }

        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            setIsActive(true);

            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            nextStartTimeRef.current = 0;

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } } },
                    systemInstruction: 'أنت مساعد صوتي ودود ومفيد. تحدث باللغة العربية.'
                },
                callbacks: {
                    onopen: () => {
                        sourceRef.current = audioContextRef.current!.createMediaStreamSource(streamRef.current!);
                        scriptProcessorRef.current = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const l = inputData.length;
                            const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) {
                                int16[i] = inputData[i] * 32768;
                            }
                            const pcmBlob = {
                                data: encode(new Uint8Array(int16.buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        
                        sourceRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(audioContextRef.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if(base64Audio) {
                            setIsModelSpeaking(true);
                            const ctx = outputAudioContextRef.current!;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                            
                            const source = ctx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(ctx.destination);
                            
                            source.addEventListener('ended', () => {
                                playingSourcesRef.current.delete(source);
                                if (playingSourcesRef.current.size === 0) {
                                    setIsModelSpeaking(false);
                                }
                            });
                            
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            playingSourcesRef.current.add(source);
                        }
                        
                        if (message.serverContent?.interrupted) {
                            playingSourcesRef.current.forEach(s => s.stop());
                            playingSourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                            setIsModelSpeaking(false);
                        }

                        if(message.serverContent?.inputTranscription) {
                            setUserTranscript(prev => prev + message.serverContent!.inputTranscription!.text);
                        }
                        if(message.serverContent?.outputTranscription) {
                            setModelTranscript(prev => prev + message.serverContent!.outputTranscription!.text);
                        }
                        if(message.serverContent?.turnComplete) {
                            const finalUserTranscript = userTranscript + (message.serverContent?.inputTranscription?.text || '');
                            const finalModelTranscript = modelTranscript + (message.serverContent?.outputTranscription?.text || '');
                            setTranscriptHistory(prev => [...prev, { user: finalUserTranscript, model: finalModelTranscript }]);
                            setUserTranscript('');
                            setModelTranscript('');
                        }
                    },
                    onclose: () => {
                        stopConversation();
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Session error:', e);
                        let message = 'حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.';
                        if (e.message) {
                            const errorMessage = e.message.toLowerCase();
                            if (errorMessage.includes('api key not valid')) {
                                message = 'مفتاح API غير صالح. يرجى التأكد من أنه تم إعداده بشكل صحيح.';
                            } else if (errorMessage.includes('quota')) {
                                message = 'تم الوصول إلى الحد الأقصى للاستخدام (Quota). يرجى المحاولة مرة أخرى لاحقًا.';
                            } else if (errorMessage.includes('network')) {
                                message = 'حدث خطأ في الشبكة. يرجى التحقق من اتصالك بالإنترنت.';
                            }
                        }
                        setError(message);
                        stopConversation();
                    },
                }
            });

        } catch (err) {
            console.error('Error starting conversation:', err);
            if (err instanceof Error && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
                setError('تم رفض الإذن بالوصول إلى الميكروفون. يرجى تمكينه في إعدادات المتصفح.');
            } else {
                setError('لم يتم العثور على ميكروفون أو حدث خطأ أثناء الوصول إليه.');
            }
            setIsActive(false);
        }
    };
    
    return (
        <div className="flex flex-col items-center text-center space-y-6">
            <h2 className="text-2xl font-bold text-amber-500 dark:text-amber-400">الدردشة الصوتية مع الذكاء الاصطناعي</h2>
            <p className="text-gray-600 dark:text-slate-400 max-w-xl">تحدث مباشرة مع مساعد الذكاء الاصطناعي. اسأل أسئلة، اطلب المساعدة، أو قم بإجراء محادثة طبيعية.</p>
            
            <div className="w-full max-w-xs">
                <label htmlFor="voice-select-chat" className="block text-lg font-medium text-gray-700 dark:text-slate-300 mb-2">اختر صوت المساعد</label>
                <select
                    id="voice-select-chat"
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    disabled={isActive}
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition disabled:opacity-50"
                >
                    {voices.map(v => <option key={v.name} value={v.name}>{v.label}</option>)}
                </select>
            </div>

            <button
                onClick={startConversation}
                className={`relative flex items-center justify-center w-24 h-24 rounded-full text-white transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-opacity-50 ${
                    isActive
                        ? 'bg-red-500 hover:bg-red-600 focus:ring-red-400'
                        : 'bg-orange-500 hover:bg-orange-600 focus:ring-orange-400'
                }`}
            >
                {isActive ? <MicOff size={40} /> : <Mic size={40} />}
                {isActive && <span className="absolute h-full w-full rounded-full bg-red-500 animate-ping opacity-75"></span>}
            </button>
            <p className="font-semibold text-lg">{isActive ? 'المحادثة جارية... اضغط للإيقاف' : 'اضغط لبدء المحادثة'}</p>

            {error && <p className="text-red-600 dark:text-red-400 font-bold">{error}</p>}

            <div className="w-full max-w-3xl min-h-[200px] bg-gray-100 dark:bg-slate-900/70 rounded-lg p-4 border border-gray-200 dark:border-slate-700 space-y-4">
                <div className="h-48 overflow-y-auto p-2 space-y-3 text-right">
                    {transcriptHistory.map((turn, index) => (
                        <div key={index}>
                            <p className="font-bold text-gray-700 dark:text-slate-300">أنت: <span className="font-normal text-gray-800 dark:text-slate-200">{turn.user}</span></p>
                            <p className="font-bold text-amber-600 dark:text-amber-400">المساعد: <span className="font-normal text-amber-700 dark:text-amber-200">{turn.model}</span></p>
                        </div>
                    ))}
                </div>
                <div className="border-t border-gray-200 dark:border-slate-700 pt-2">
                    <p className="font-bold text-gray-700 dark:text-slate-300">أنت: <span className="font-normal text-gray-800 dark:text-slate-200">{userTranscript}</span></p>
                    <div className="flex items-center justify-end">
                      <p className="font-bold text-amber-600 dark:text-amber-400">المساعد: <span className="font-normal text-amber-700 dark:text-amber-200">{modelTranscript}</span></p>
                      {isModelSpeaking && <Volume2 className="text-amber-500 dark:text-amber-400 animate-pulse ms-2" />}
                    </div>
                </div>
            </div>
        </div>
    );
};