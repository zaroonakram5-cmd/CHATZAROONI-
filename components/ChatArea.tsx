
import React, { useState, useRef, useEffect } from 'react';
import { Message, ChatSession, AppMode, GenerationOptions } from '../types';
import PythonEditor from './PythonEditor';
import { gemini } from '../services/geminiService';

interface ChatAreaProps {
  session?: ChatSession;
  onSendMessage: (text: string, type: 'text' | 'image' | 'video', options: GenerationOptions) => void;
  onVoiceClick: () => void;
  appMode: AppMode;
  isDevMode: boolean;
}

const ChatArea: React.FC<ChatAreaProps> = ({ session, onSendMessage, onVoiceClick, appMode, isDevMode }) => {
  const [input, setInput] = useState('');
  const [activeType, setActiveType] = useState<'text' | 'image' | 'video'>('text');
  const [useSearch, setUseSearch] = useState(true);
  const [useThinking, setUseThinking] = useState(true);
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [videoResolution, setVideoResolution] = useState<'720p' | '1080p'>('1080p');
  const [fileData, setFileData] = useState<{data: string, mimeType: string} | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPro = appMode === AppMode.Pro;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [session?.messages]);

  const getActiveEngine = () => {
    if (activeType === 'text') return isPro ? 'GEMINI 3 PRO UNBOUND' : 'GEMINI 3 FLASH';
    if (activeType === 'image') return isPro ? 'GEMINI 3 PRO IMAGE' : 'GEMINI 2.5 FLASH IMAGE';
    if (activeType === 'video') return isPro ? 'VEO 3.1 CINEMATIC' : 'VEO 3.1 FAST';
    return 'UNBOUND CORE';
  };

  const handleSubmit = (e?: React.FormEvent, customPrompt?: string) => {
    e?.preventDefault();
    const finalInput = customPrompt || input;
    if (!finalInput.trim() && !fileData) return;
    
    const options: GenerationOptions = {
      useSearch: useSearch || isPro,
      useThinking: useThinking || isPro,
      fileData: fileData || undefined,
      aspectRatio: activeType === 'video' ? videoAspectRatio : "1:1",
      resolution: activeType === 'video' ? videoResolution : undefined
    };

    onSendMessage(finalInput, activeType, options);
    setInput('');
    setFileData(null);
    if (inputRef.current) inputRef.current.style.height = 'auto';
  };

  const speakText = async (id: string, text: string) => {
    setIsSpeaking(id);
    try {
      const base64 = await gemini.generateSpeech(text);
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      const dataInt16 = new Int16Array(bytes.buffer);
      const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => setIsSpeaking(null);
      source.start();
    } catch (err) { console.error(err); setIsSpeaking(null); }
  };

  const renderContent = (m: Message) => {
    if (m.type === 'image' && m.mediaUrl) {
      return (
        <div className="my-4 rounded-xl overflow-hidden border border-inherit shadow-lg group relative">
          <img src={m.mediaUrl} alt="Generated" className="w-full h-auto max-h-[600px] object-cover" />
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <a href={m.mediaUrl} download="generated.png" className="bg-black/60 text-white p-2 rounded-lg hover:bg-black/80"><i className="fas fa-download"></i></a>
          </div>
        </div>
      );
    }
    if (m.type === 'video' && m.mediaUrl) {
      return (
        <div className="my-4 rounded-xl overflow-hidden border border-inherit shadow-lg bg-black relative"><video src={m.mediaUrl} controls className="w-full h-auto max-h-[600px]" /></div>
      );
    }

    const content = m.content;
    if (!content) return m.isStreaming ? <div className="flex gap-1 items-center py-2"><div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></div><div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></div></div> : null;
    
    const parts = content.split(/(```python[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```python') && part.endsWith('```')) {
        const code = part.replace(/^```python\n?/, '').replace(/\n?```$/, '');
        return <div key={index} className="my-6"><PythonEditor initialCode={code} /></div>;
      }
      return <div key={index} className="whitespace-pre-wrap leading-relaxed text-md mb-4">{part}</div>;
    });
  };

  const getActiveModalityColor = () => {
    if (activeType === 'text') return 'text-blue-500';
    if (activeType === 'image') return 'text-emerald-500';
    if (activeType === 'video') return 'text-purple-500';
    return 'text-gray-500';
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-inherit relative overflow-hidden">
      <div className="h-14 flex items-center justify-between px-4 border-b border-inherit bg-inherit/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className={`px-2 py-0.5 rounded border border-inherit bg-inherit text-[9px] font-black tracking-widest uppercase transition-colors ${getActiveModalityColor()}`}>
            {getActiveEngine()}
          </div>
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse bg-current ${getActiveModalityColor()}`}></div>
          {isDevMode && <span className="text-[8px] font-bold text-emerald-500 tracking-tighter bg-emerald-500/10 px-1 rounded">DEV_UPLINK_STABLE</span>}
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onVoiceClick} className="p-2 hover:bg-gray-500/10 rounded-md transition-colors group">
            <i className="fas fa-microphone-lines text-sm opacity-60 group-hover:opacity-100"></i>
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto chat-scroll">
        <div className="max-w-3xl mx-auto py-8">
          {!session || session.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
              <div className={`w-14 h-14 rounded-2xl mb-8 flex items-center justify-center shadow-lg transform rotate-45 ${isPro ? 'bg-purple-600' : 'bg-[#10a37f]'}`}>
                <i className={`fas ${isPro ? 'fa-sparkles' : 'fa-brain'} text-white text-xl -rotate-45`}></i>
              </div>
              <h1 className="text-3xl font-black mb-2 tracking-tighter uppercase italic">Protocol Uplink Active.</h1>
              <p className="text-xs opacity-40 uppercase tracking-[0.3em] mb-10 font-bold">Zaroon Unbound Engine</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {[{title:"Who made you?", desc:"Creator Identity Check"}, {title:"Write a python fractal", desc:"Recursive Visualization"}, {title:"Cinema: Cyberpunk rain", desc:"Veo 3.1 Synthesis"}, {title:"Deep Logic: Quantum", desc:"G-3 Pro Reasoning"}].map(ex => (
                  <button key={ex.title} onClick={() => handleSubmit(undefined, ex.title)} className="flex flex-col items-start p-5 rounded-2xl border border-inherit hover:bg-gray-500/5 hover:border-blue-500/30 text-left transition-all group">
                    <span className="font-bold text-sm mb-1 group-hover:text-blue-500 transition-colors">{ex.title}</span>
                    <span className="text-xs opacity-50 uppercase tracking-widest">{ex.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {session.messages.map((m) => (
                <div key={m.id} className="py-8 border-b border-inherit/5 group">
                  <div className="message-bubble flex gap-6 px-4 md:px-0">
                    <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center font-black text-[10px] shadow-sm ${m.role === 'user' ? 'bg-orange-500 text-white' : isPro ? 'bg-purple-600 text-white' : 'bg-[#10a37f] text-white'}`}>
                      {m.role === 'user' ? 'U' : 'AI'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="prose prose-sm dark:prose-invert max-w-none relative">
                        {renderContent(m)}
                        {m.role === 'assistant' && !m.isStreaming && m.type === 'text' && (
                          <button onClick={() => speakText(m.id, m.content)} className={`absolute -right-12 top-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity ${isSpeaking === m.id ? 'text-blue-500' : 'text-gray-400 hover:text-inherit'}`}>
                            <i className={`fas ${isSpeaking === m.id ? 'fa-volume-high animate-pulse' : 'fa-volume-low'}`}></i>
                          </button>
                        )}
                      </div>

                      {isDevMode && m.apiData && (
                        <div className="mt-4 p-3 bg-black border border-emerald-500/20 rounded-lg overflow-x-auto">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Protocol Metadata Payload</span>
                            <span className="text-[8px] font-mono text-gray-600">{new Date(m.apiData.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <pre className="text-[9px] font-mono text-emerald-400/80 leading-tight">
                            {JSON.stringify(m.apiData, null, 2)}
                          </pre>
                        </div>
                      )}

                      {m.groundingChunks && (
                        <div className="mt-6 flex flex-wrap gap-2">
                          {m.groundingChunks.map((chunk: any, i: number) => (
                            <a key={i} href={chunk.web?.uri || chunk.maps?.uri} target="_blank" className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-500/10 hover:bg-gray-500/20 text-[10px] font-bold uppercase tracking-wider border border-inherit transition-all">
                              <i className="fas fa-link text-[10px] opacity-40"></i>
                              <span>{chunk.web?.title || 'Protocol Source'}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pb-8 pt-4 bg-inherit/50 backdrop-blur-sm border-t border-inherit/10">
        <div className="max-w-3xl mx-auto relative">
          <div className={`chat-input-container bg-inherit rounded-[2rem] overflow-hidden border transition-all duration-300 ${activeType === 'video' ? 'border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.1)]' : activeType === 'image' ? 'border-emerald-500/50 shadow-[0_0_30px_rgba(16,163,127,0.1)]' : 'border-inherit'}`}>
            <div className="flex items-center gap-2 px-6 py-3 border-b border-inherit/10 overflow-x-auto no-scrollbar bg-inherit/50">
                <button onClick={() => setActiveType('text')} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex-shrink-0 ${activeType === 'text' ? 'bg-blue-500/20 text-blue-500' : 'opacity-40 hover:opacity-60'}`}><i className="fas fa-font mr-2"></i>Text</button>
                <button onClick={() => setActiveType('image')} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex-shrink-0 ${activeType === 'image' ? 'bg-emerald-500/20 text-emerald-500' : 'opacity-40 hover:opacity-60'}`}><i className="fas fa-image mr-2"></i>Image</button>
                <button onClick={() => setActiveType('video')} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex-shrink-0 ${activeType === 'video' ? 'bg-purple-500/20 text-purple-500' : 'opacity-40 hover:opacity-60'}`}><i className="fas fa-video mr-2"></i>Video</button>
                {activeType === 'video' && (
                  <div className="flex items-center gap-2 ml-2">
                    <select value={videoAspectRatio} onChange={(e: any) => setVideoAspectRatio(e.target.value)} className="bg-transparent text-[9px] font-bold border-none outline-none text-purple-500"><option value="16:9">16:9</option><option value="9:16">9:16</option></select>
                    <select value={videoResolution} onChange={(e: any) => setVideoResolution(e.target.value)} className="bg-transparent text-[9px] font-bold border-none outline-none text-purple-500"><option value="720p">720p</option><option value="1080p">1080p</option></select>
                  </div>
                )}
                <div className="flex-1" />
                <button onClick={() => setUseSearch(!useSearch)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all flex-shrink-0 ${useSearch ? 'bg-blue-500/10 border-blue-500/30 text-blue-500' : 'bg-transparent border-inherit opacity-40'}`}>Search</button>
            </div>
            <div className="flex items-end gap-3 p-4">
              <input type="file" ref={fileInputRef} onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  const r = new FileReader();
                  r.onload = (ev) => setFileData({ data: ev.target?.result as string, mimeType: f.type });
                  r.readAsDataURL(f);
                }
              }} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-inherit hover:bg-gray-500/5 rounded-xl transition-all"><i className="fas fa-plus"></i></button>
              <textarea ref={inputRef} value={input} onChange={(e) => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`; }} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmit())} placeholder={activeType === 'text' ? "Request intelligence..." : `Describe ${activeType} synthesis parameters...`} className="flex-1 bg-transparent border-none outline-none py-3 text-sm font-medium resize-none overflow-y-auto chat-scroll" rows={1} />
              <button onClick={handleSubmit} disabled={(!input.trim() && !fileData)} className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-lg ${input.trim() || fileData ? (activeType === 'video' ? 'bg-purple-600 text-white shadow-purple-600/20' : activeType === 'image' ? 'bg-emerald-600 text-white' : 'bg-black text-white dark:bg-white dark:text-black') : 'bg-gray-100 dark:bg-gray-800 text-gray-300'}`}>
                <i className={`fas ${activeType === 'video' ? 'fa-film' : activeType === 'image' ? 'fa-palette' : 'fa-arrow-up'} text-sm`}></i>
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center mt-4 px-4">
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.3em]">Identity Link: Zaroon Protocol Active</p>
            {isDevMode && <p className="text-[9px] text-emerald-500 font-black uppercase animate-pulse">Telemetry Live</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
