export type Tool = 'chatbot' | 'imageDescription' | 'imageGeneration' | 'voiceChat' | 'studyBuddy' | 'textToSpeech' | 'videoSummarizer' | 'cvGrader' | 'imageEnhancement' | 'videoScriptGenerator' | 'promptWriter' | 'aiContentDetector' | 'codeGeneration' | 'googleSearch' | 'translation';

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}