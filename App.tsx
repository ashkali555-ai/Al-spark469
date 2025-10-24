
import React, { useState, useEffect, useRef } from 'react';
import { ImageDescriptionTool } from './components/ImageDescriptionTool';
import { ImageGenerationTool } from './components/ImageGenerationTool';
import { VoiceChatTool } from './components/VoiceChatTool';
import { StudyBuddyTool } from './components/StudyBuddyTool';
import { TextToSpeechTool } from './components/TextToSpeechTool';
import { VideoSummarizerTool } from './components/VideoSummarizerTool';
import { CvGraderTool } from './components/CvGraderTool';
import { ImageCompressionTool } from './components/ImageCompressionTool';
import { ChatbotTool } from './components/ChatbotTool';
import { VideoScriptGeneratorTool } from './components/VideoScriptGeneratorTool';
import { PromptWriterTool } from './components/PromptWriterTool';
import { AiContentDetectorTool } from './components/AiContentDetectorTool';
import { CodeGenerationTool } from './components/CodeGenerationTool';
import { GoogleSearchTool } from './components/GoogleSearchTool';
import { TranslationTool } from './components/TranslationTool';
import type { Tool } from './types';
import { ScanSearch, Sparkles, Mic, GraduationCap, AudioWaveform, Clapperboard, FileText, ImageUp, Sun, Moon, MessageSquare, ChevronDown, FileVideo, WandSparkles, Fingerprint, Terminal, Globe, Languages } from 'lucide-react';


const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<Tool>('chatbot');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedTheme = window.localStorage.getItem('theme');
      if (storedTheme === 'light' || storedTheme === 'dark') {
        return storedTheme;
      }
    }
    return 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  const mainTools: { id: Tool; name: string; icon: React.ReactNode }[] = [
    { id: 'chatbot', name: 'روبوت المحادثة', icon: <MessageSquare className="ms-2" /> },
    { id: 'imageDescription', name: 'وصف الصورة', icon: <ScanSearch className="ms-2" /> },
    { id: 'imageGeneration', name: 'توليد الصور', icon: <Sparkles className="ms-2" /> },
    { id: 'voiceChat', name: 'الدردشة الصوتية', icon: <Mic className="ms-2" /> },
  ];

  const dropdownTools: { id: Tool; name: string; icon: React.ReactNode }[] = [
    { id: 'translation', name: 'الترجمة الفورية', icon: <Languages className="ms-2" /> },
    { id: 'studyBuddy', name: 'المساعد الدراسي', icon: <GraduationCap className="ms-2" /> },
    { id: 'textToSpeech', name: 'تحويل النص إلى صوت', icon: <AudioWaveform className="ms-2" /> },
    { id: 'videoSummarizer', name: 'ملخص الفيديو', icon: <Clapperboard className="ms-2" /> },
    { id: 'videoScriptGenerator', name: 'كاتب سيناريو الفيديو', icon: <FileVideo className="ms-2" /> },
    { id: 'promptWriter', name: 'كاتب البرومبت الذكي', icon: <WandSparkles className="ms-2" /> },
    { id: 'cvGrader', name: 'مدقق السيرة الذاتية', icon: <FileText className="ms-2" /> },
    { id: 'codeGeneration', name: 'مولد الأكواد', icon: <Terminal className="ms-2" /> },
    { id: 'aiContentDetector', name: 'كاشف محتوى الذكاء الاصطناعي', icon: <Fingerprint className="ms-2" /> },
    { id: 'imageEnhancement', name: 'محسن الصور', icon: <ImageUp className="ms-2" /> },
    { id: 'googleSearch', name: 'استخدام بيانات بحث Google', icon: <Globe className="ms-2" /> },
  ];

  const renderTool = () => {
    switch (activeTool) {
      case 'chatbot':
        return <ChatbotTool />;
      case 'imageDescription':
        return <ImageDescriptionTool />;
      case 'imageGeneration':
        return <ImageGenerationTool />;
      case 'voiceChat':
        return <VoiceChatTool />;
      case 'studyBuddy':
        return <StudyBuddyTool />;
      case 'textToSpeech':
        return <TextToSpeechTool />;
      case 'videoSummarizer':
        return <VideoSummarizerTool />;
      case 'videoScriptGenerator':
        return <VideoScriptGeneratorTool />;
      case 'promptWriter':
        return <PromptWriterTool />;
      case 'cvGrader':
        return <CvGraderTool />;
      case 'imageEnhancement':
        return <ImageCompressionTool />;
      case 'aiContentDetector':
        return <AiContentDetectorTool />;
      case 'codeGeneration':
        return <CodeGenerationTool />;
      case 'googleSearch':
        return <GoogleSearchTool />;
      case 'translation':
        return <TranslationTool />;
      default:
        return <ChatbotTool />;
    }
  };

  const handleToolSelect = (toolId: Tool) => {
    setActiveTool(toolId);
    setIsDropdownOpen(false);
  }

  const allTools = [...mainTools, ...dropdownTools];
  const activeToolName = allTools.find(t => t.id === activeTool)?.name;
  const currentYear = new Date().getFullYear();

  return (
    <div className="bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-slate-200 min-h-screen flex flex-col transition-colors duration-300">
      <header className="flex justify-between items-center py-4 px-6 md:px-8 border-b border-gray-200 dark:border-slate-700/50">
        <div className="text-center flex-grow">
          <h1 className="text-3xl md:text-4xl font-bold">
            <span className="text-red-600" style={{ textShadow: '0 0 10px rgba(220, 38, 38, 0.4)' }}>AI Spark - </span>
            <span className="text-gray-900 dark:text-white">شرارة الذكاء الاصطناعي</span>
          </h1>
          <p className="text-md text-gray-600 dark:text-slate-400 mt-1">الابتكار يلتهب هنا: أدوات الذكاء الاصطناعي بين يديك.</p>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
        </button>
      </header>
      
      <main className="container mx-auto p-4 md:p-8 flex-grow">
        <nav className="flex flex-wrap justify-center gap-2 md:gap-4 mb-8">
          {mainTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => handleToolSelect(tool.id)}
              className={`group flex items-center justify-center px-4 py-2 rounded-lg transform transition-all duration-300 font-bold text-sm md:text-base active:scale-95 ${
                activeTool === tool.id
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-white dark:bg-slate-700/60 text-gray-700 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-slate-700 hover:text-amber-600 dark:hover:text-amber-400'
              }`}
            >
              {tool.name}
              {React.cloneElement(tool.icon as React.ReactElement, {
                className: `ms-2 transition-transform duration-200 group-hover:scale-110 ${activeTool === tool.id ? 'animate-pulse-glow' : ''}`
              })}
            </button>
          ))}
          <div className="relative" ref={dropdownRef}>
             <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`group flex items-center justify-center px-4 py-2 rounded-lg transform transition-all duration-300 font-bold text-sm md:text-base active:scale-95 ${
                dropdownTools.some(t => t.id === activeTool)
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-white dark:bg-slate-700/60 text-gray-700 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-slate-700 hover:text-amber-600 dark:hover:text-amber-400'
              }`}
            >
              أدوات أخرى
              <ChevronDown className={`ms-2 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''} group-hover:scale-125`} />
            </button>
            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 z-10">
                {dropdownTools.map((tool) => (
                   <button
                    key={tool.id}
                    onClick={() => handleToolSelect(tool.id)}
                    className={`group flex items-center w-full text-right px-4 py-3 text-sm md:text-base transition-colors ${
                      activeTool === tool.id 
                      ? 'bg-amber-100 dark:bg-slate-700 text-amber-600 dark:text-amber-400' 
                      : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    {React.cloneElement(tool.icon as React.ReactElement, {
                       className: `ms-2 transition-transform duration-200 group-hover:scale-110 ${activeTool === tool.id ? 'animate-pulse-glow' : ''}`
                    })}
                    <span className="flex-grow">{tool.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>
        
        <div key={activeTool} className="tool-container-enter bg-white dark:bg-slate-800/50 p-4 sm:p-6 md:p-8 rounded-2xl border border-gray-200 dark:border-slate-700/50 shadow-lg shadow-gray-900/5">
          {renderTool()}
        </div>
      </main>

       <footer className="text-center py-5 bg-orange-500 text-white mt-8">
            <p>&copy; {currentYear} شرارة الذكاء الاصطناعي. جميع الحقوق محفوظة.</p>
            <p>مطور الموقع: <a href="https://www.facebook.com/share/1ESW3PjdeW/" target="_blank" rel="noopener noreferrer" className="text-amber-200 no-underline hover:underline">Muhammad falih</a></p>
        </footer>
    </div>
  );
};

export default App;
