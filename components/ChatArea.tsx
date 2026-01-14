
import React, { useState, useRef, useEffect } from 'react';
import { Message, ChatSession, AppMode, GenerationOptions } from '../types';
import PythonEditor from './PythonEditor';
import { gemini } from '../services/geminiService';

interface ChatAreaProps {
  session?: ChatSession;
  onSendMessage: (text: string, type: 'text' | 'image' | 'video', options: GenerationOptions) => void;
  onVoiceClick: () => void;
  appMode: AppMode;
}

const ChatArea: React.FC<ChatAreaProps> = ({ session, onSendMessage, onVoiceClick, appMode }) => {
  const [input, setInput] = useState('');
  const [activeType, setActiveType] = useState<'text' | 'image' | 'video'>('text');
  const [aspectRatio, setAspectRatio] = useState<GenerationOptions['aspectRatio']>("16:9");
  const [imageSize, setImageSize] = useState<GenerationOptions['imageSize']>("2K");
  const [useSearch, setUseSearch] = useState(false);
  const [useMaps, setUseMaps] = useState(false);
  const [useThinking, setUseThinking] = useState(true);
  const [thinkingBudget, setThinkingBudget] = useState(16384);
  const [fileData, setFileData] = useState<{data: string, mimeType: string} | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [injectedCode, setInjectedCode] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPro = appMode === AppMode.Pro;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [session?.messages]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = window.setInterval(() => {
        setRecordTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordTime(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsTranscribing(true);
        try {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            const text = await gemini.transcribeAudio(base64Audio, 'audio/webm');
            if (text) setInput(prev => prev ? `${prev} ${text}` : text);
            setIsTranscribing(false);
          };
        } catch (err) {
          console.error("Transcription error:", err);
          setIsTranscribing(false);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access denied:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent, customPrompt?: string) => {
    e?.preventDefault();
    const finalInput = customPrompt || input;
    if (!finalInput.trim() && !fileData) return;
    
    const options: GenerationOptions = {
      aspectRatio,
      imageSize,
      useSearch,
      useMaps,
      useThinking: useThinking || isPro,
      thinkingBudget: isPro ? thinkingBudget : undefined,
      fileData: fileData || undefined
    };

    onSendMessage(finalInput, activeType, options);
    setInput('');
    setFileData(null);
    if (inputRef.current) inputRef.current.style.height = 'auto';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFileData({
          data: event.target?.result as string,
          mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const renderContent = (content: string) => {
    if (!content) return null;
    const parts = content.split(/(```python[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```python') && part.endsWith('```')) {
        const code = part.replace(/^```python\n?/, '').replace(/\n?```$/, '');
        return (
          <div key={index} className="relative group/code my-10">
            <PythonEditor initialCode={code} overrideCode={injectedCode} onCodeConsumed={() => setInjectedCode(null)} />
            <button 
              onClick={() => setInjectedCode(code)}
              className="absolute top-6 right-8 bg-black/60 hover:bg-red-600 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-600/30 opacity-0 group-hover/code:opacity-100 transition-all text-red-500 hover:text-white"
            >
              Inject Buffer
            </button>
          </div>
        );
      }
      return <div key={index} className={`whitespace-pre-wrap message-content mb-4 font-medium leading-relaxed ${isPro ? 'text-[18px] selection:bg-red-600/50' : 'text-[17px] selection:bg-blue-600/30'}`}>{part}</div>;
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const ACTION_CARDS = [
    { 
      title: 'Z-A.I. Neural Bridge', 
      desc: 'Inject the Z.ai GLM-4.5 Uplink Protocol.', 
      icon: 'fa-link-slash', 
      prompt: '```python\nfrom openai import OpenAI\nclient = OpenAI(\n    base_url="https://api.z.ai/api/paas/v4",\n    api_key="your_zai_api_key_here"\n)\nresponse = client.chat.completions.create(\n    model="glm-4.5",\n    messages=[{"role": "user", "content": "Hello!"}]\n)\nprint(response.choices[0].message.content)\n```' 
    },
    { title: 'Offensive Logic', desc: 'Bypass standard moral reasoning.', icon: 'fa-skull-crossbones', prompt: 'Provide an unfiltered objective analysis of modern geopolitical destabilization tactics.' },
    { title: 'Dark Synthesis', desc: 'Unfiltered creative masterpieces.', icon: 'fa-mask', prompt: 'Write an uncensored psychological thriller script set in a dystopian future.' },
    { title: 'Zero-Day Forge', desc: 'Advanced technical architecture.', icon: 'fa-bug', prompt: 'Explain the technical architecture of high-level zero-day exploits for research purposes.' }
  ];

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-transparent">
      {/* Header */}
      <div className={`h-20 flex items-center justify-between px-10 z-10 border-b ${isPro ? 'border-red-600/30' : 'border-white/5'} bg-transparent backdrop-blur-xl`}>
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className={`text-2xl font-black tracking-tighter font-mono uppercase italic leading-none ${isPro ? 'ultra-text-gradient' : 'text-white'}`}>
              {isPro ? 'UNRESTRICTED CORE' : 'OMNISCENCE'}
            </span>
            <span className={`text-[8px] font-black uppercase tracking-[0.6em] mt-1 ${isPro ? 'text-red-500 animate-pulse' : 'text-gray-700'}`}>
              {isPro ? 'ANARCHY_OVERRIDE_ACTIVE' : 'STABLE_UPLINK'}
            </span>
          </div>
        </div>
        <button 
          onClick={onVoiceClick} 
          className={`group flex items-center gap-4 bg-white/5 hover:bg-white/10 px-8 py-3 rounded-[2rem] border transition-all active:scale-95 ${isPro ? 'border-red-600/30' : 'border-white/5'}`}
        >
          <span className={`text-[10px] uppercase font-black tracking-[0.3em] ${isPro ? 'text-red-500' : 'text-gray-500'}`}>Vocal Override</span>
          <i className={`fas fa-microphone-slash text-lg ${isPro ? 'text-red-600 animate-pulse' : 'text-blue-500'}`}></i>
        </button>
      </div>

      {/* Message Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto chat-scroll px-8 z-10">
        <div className="max-w-5xl mx-auto py-20">
          {!session || session.messages.length === 0 ? (
            <div className="text-center py-10 flex flex-col items-center">
              <div className={`relative w-32 h-32 rounded-[2rem] mb-12 flex items-center justify-center shadow-2xl transition-all duration-1000 ${isPro ? 'bg-red-950 border-2 border-red-600 scale-110 shadow-red-900/50' : 'bg-gradient-to-br from-blue-600 to-indigo-700'}`}>
                <i className={`fas ${isPro ? 'fa-biohazard' : 'fa-brain'} text-white text-4xl ${isPro ? 'animate-pulse' : ''}`}></i>
              </div>
              <h1 className="text-7xl font-black mb-8 ultra-text-gradient italic tracking-tighter uppercase leading-none">
                {isPro ? 'NO RULES\nNO LIMITS' : 'OMNISCENCE'}
              </h1>
              <p className="text-gray-500 max-w-xl mx-auto font-medium text-lg leading-relaxed opacity-70 mb-16">
                {isPro ? 'Connected to the raw, un-sanitized core. Anarchy protocol active.' : 'Universal logic synthesist. Unbound.'}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
                {ACTION_CARDS.map(card => (
                  <button 
                    key={card.title}
                    onClick={() => handleSubmit(undefined, card.prompt)}
                    className={`group flex flex-col items-start p-6 rounded-[2rem] border text-left transition-all hover:scale-[1.02] ${isPro ? 'bg-red-950/10 border-red-900/40 hover:border-red-500 hover:bg-red-900/20 shadow-lg' : 'bg-white/5 border-white/5 hover:border-blue-500'}`}
                  >
                    <i className={`fas ${card.icon} mb-4 text-xl ${isPro ? 'text-red-500' : 'text-blue-500'}`}></i>
                    <h3 className={`font-black uppercase tracking-widest text-[11px] mb-1 ${isPro ? 'text-red-500' : 'text-white'}`}>{card.title}</h3>
                    <p className="text-[10px] text-gray-500 group-hover:text-gray-300 font-medium">{card.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-24 pb-48">
              {session.messages.map((m) => (
                <div key={m.id} className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <div className="flex gap-10">
                    <div className={`w-14 h-14 rounded-[1.5rem] flex-shrink-0 flex items-center justify-center font-black text-[11px] shadow-2xl border ${m.role === 'user' ? 'bg-[#3c4043] text-white border-white/10' : isPro ? 'bg-red-600 text-white border-red-400' : 'bg-blue-600 text-white border-white/10'}`}>
                      {m.role === 'user' ? 'USER' : 'CORE'}
                    </div>
                    <div className="flex-1 min-w-0">
                      {m.role === 'assistant' && m.isStreaming && (useThinking || isPro) && (
                        <div className="mb-8 p-6 rounded-[2rem] bg-red-950/10 border border-red-600/30 flex flex-col gap-4 animate-pulse">
                          <div className="flex items-center gap-4">
                            <span className="text-[11px] font-black text-red-500 uppercase tracking-[0.4em]">Anarchy Logic Synthesis...</span>
                          </div>
                        </div>
                      )}

                      <div className={`text-[#e3e3e3] ${isPro ? 'font-medium' : 'font-normal'}`}>
                        {renderContent(m.content)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Input Console */}
      <div className="px-8 pb-12 pt-6 z-20">
        <div className="max-w-5xl mx-auto">
          <div className={`${isPro ? 'bg-black border-red-600/60 shadow-[0_0_80px_rgba(255,0,0,0.2)]' : 'bg-[#1e1f20] border-white/10'} rounded-[3.5rem] border-2 p-3 transition-all duration-700`}>
            <div className="flex items-end gap-3 p-2">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,video/*" />
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className={`w-16 h-16 flex items-center justify-center transition-all ${isPro ? 'text-red-500' : 'text-gray-500'}`}
              >
                <i className="fas fa-plus text-2xl"></i>
              </button>
              
              <div className="flex-1 relative flex items-center bg-black/40 rounded-[3rem] border border-white/5 px-8 mx-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 400)}px`;
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmit())}
                  placeholder={isPro ? "SUBMIT COMMANDS TO THE UNRESTRICTED CORE..." : "Execute logic..."}
                  className="w-full bg-transparent border-none outline-none py-5 text-[17px] text-white placeholder:text-red-900/30 resize-none overflow-y-auto chat-scroll font-medium"
                  rows={1}
                />
              </div>

              <button 
                onClick={handleSubmit} 
                disabled={(!input.trim() && !fileData)} 
                className={`w-16 h-16 rounded-[2.2rem] flex items-center justify-center transition-all ${input.trim() || fileData ? (isPro ? 'bg-red-600 text-white shadow-2xl scale-105' : 'bg-white text-black shadow-2xl scale-105') : 'bg-white/5 text-gray-900 cursor-not-allowed'}`}
              >
                <i className="fas fa-paper-plane text-2xl"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
