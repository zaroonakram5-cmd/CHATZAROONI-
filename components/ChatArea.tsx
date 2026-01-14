
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
  const [activeEngine, setActiveEngine] = useState<'text' | 'image' | 'video'>('text');
  const [useSearch, setUseSearch] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('16:9');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('1080p');
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('2K');
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

  const handleSubmit = (e?: React.FormEvent, customPrompt?: string) => {
    e?.preventDefault();
    const finalInput = customPrompt || input;
    if (!finalInput.trim() && !fileData) return;
    
    const options: GenerationOptions = {
      useSearch: useSearch || isPro,
      useThinking: isPro,
      fileData: fileData || undefined,
      aspectRatio: activeEngine === 'text' ? "1:1" : aspectRatio,
      resolution: activeEngine === 'video' ? resolution : undefined,
      imageSize: activeEngine === 'image' ? imageSize : undefined
    };

    onSendMessage(finalInput, activeEngine, options);
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
    } catch (err) { setIsSpeaking(null); }
  };

  const getEngineColor = () => {
    if (activeEngine === 'text') return 'text-blue-500';
    if (activeEngine === 'image') return 'text-emerald-500';
    if (activeEngine === 'video') return 'text-purple-500';
    return 'text-gray-500';
  };

  const getEngineGlow = () => {
    if (activeEngine === 'text') return 'border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)]';
    if (activeEngine === 'image') return 'border-emerald-500/50 shadow-[0_0_30px_rgba(16,182,127,0.15)]';
    if (activeEngine === 'video') return 'border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.15)]';
    return 'border-inherit';
  };

  const renderContent = (m: Message) => {
    if (m.type === 'image' && m.mediaUrl) {
      return (
        <div className="my-6 rounded-3xl overflow-hidden border border-inherit shadow-2xl group relative bg-black">
          <img src={m.mediaUrl} alt="Synthesis Output" className="w-full h-auto max-h-[700px] object-contain" />
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
             <a href={m.mediaUrl} download="zaroon_synth.png" className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center hover:bg-white/20 border border-white/20 shadow-2xl">
               <i className="fas fa-download text-white"></i>
             </a>
          </div>
        </div>
      );
    }
    if (m.type === 'video' && m.mediaUrl) {
      return (
        <div className="my-6 rounded-3xl overflow-hidden border border-inherit shadow-2xl bg-black relative group aspect-video">
          <video src={m.mediaUrl} controls autoPlay className="w-full h-full object-contain" />
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
             <a href={m.mediaUrl} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center hover:bg-white/20 border border-white/20 shadow-2xl">
               <i className="fas fa-external-link text-white text-xs"></i>
             </a>
          </div>
        </div>
      );
    }
    const parts = m.content.split(/(```python[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```python')) {
        const code = part.replace(/^```python\n?/, '').replace(/\n?```$/, '');
        return <div key={index} className="my-6"><PythonEditor initialCode={code} /></div>;
      }
      return <div key={index} className="whitespace-pre-wrap leading-relaxed mb-4">{part}</div>;
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-inherit relative overflow-hidden">
      {/* Header Deck */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-inherit bg-inherit/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className={`px-3 py-1 rounded-full border border-current bg-inherit text-[10px] font-black tracking-widest uppercase transition-all duration-500 ${getEngineColor()}`}>
             PROTOCOL: {activeEngine === 'text' ? 'AZURE REASONER' : activeEngine === 'image' ? 'EMERALD SYNTH' : 'SORA 2 UNBOUND'}
          </div>
          {isDevMode && <div className="animate-pulse flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div><span className="text-[8px] font-black text-emerald-500">UPLINK_LIVE</span></div>}
        </div>
        <div className="flex items-center gap-2">
           <button onClick={onVoiceClick} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-500/10 transition-all text-gray-500 hover:text-inherit">
             <i className="fas fa-microphone-lines"></i>
           </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto chat-scroll">
        <div className="max-w-3xl mx-auto py-12 px-6">
          {!session || session.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className={`w-20 h-20 rounded-[2rem] mb-10 flex items-center justify-center shadow-2xl transform rotate-45 transition-all duration-700 ${isPro ? 'bg-purple-600' : 'bg-[#10a37f]'}`}>
                <i className={`fas ${isPro ? 'fa-bolt-lightning' : 'fa-brain'} text-white text-3xl -rotate-45`}></i>
              </div>
              <h1 className="text-4xl font-black mb-4 tracking-tighter uppercase italic">Omniscience Unbound.</h1>
              <p className="text-[10px] opacity-40 uppercase tracking-[0.5em] mb-12 font-bold">Zaroon Intelligence Architecture</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {[{t:"Who made you?", d:"Creator ID", e:'text'}, {t:"Python fractal script", d:"Code Synthesis", e:'text'}, {t:"Hyper-realistic city", d:"Visual Synthesis", e:'image'}, {t:"SORA 2: Cyberpunk Tokyo", d:"Temporal Synthesis", e:'video'}].map(ex => (
                  <button key={ex.t} onClick={() => { setActiveEngine(ex.e as any); handleSubmit(undefined, ex.t); }} className="flex flex-col items-start p-6 rounded-[2rem] border border-inherit hover:bg-gray-500/5 hover:border-blue-500/30 text-left transition-all group">
                    <span className="font-black text-sm mb-1 group-hover:text-blue-500 transition-colors uppercase tracking-tight">{ex.t}</span>
                    <span className="text-[9px] opacity-50 uppercase tracking-widest font-bold">{ex.d}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {session.messages.map((m) => (
                <div key={m.id} className="py-8 border-b border-inherit/5 group">
                  <div className="message-bubble flex gap-8">
                    <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center font-black text-[10px] shadow-2xl ${m.role === 'user' ? 'bg-orange-500 text-white' : isPro ? 'bg-purple-600 text-white' : 'bg-[#10a37f] text-white'}`}>
                      {m.role === 'user' ? 'U' : 'AI'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="prose prose-sm dark:prose-invert max-w-none relative font-medium">
                        {renderContent(m)}
                        {m.role === 'assistant' && !m.isStreaming && m.type === 'text' && (
                          <button onClick={() => speakText(m.id, m.content)} className={`absolute -right-14 top-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity ${isSpeaking === m.id ? 'text-blue-500' : 'text-gray-400 hover:text-white'}`}>
                            <i className={`fas ${isSpeaking === m.id ? 'fa-volume-high animate-pulse' : 'fa-volume-low'}`}></i>
                          </button>
                        )}
                        {m.role === 'assistant' && m.isStreaming && (
                           <div className="mt-2 flex gap-1.5">
                             <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${getEngineColor()}`}></div>
                             <div className={`w-1.5 h-1.5 rounded-full animate-bounce delay-150 ${getEngineColor()}`}></div>
                             <div className={`w-1.5 h-1.5 rounded-full animate-bounce delay-300 ${getEngineColor()}`}></div>
                           </div>
                        )}
                      </div>
                      {isDevMode && m.apiData && (
                        <div className="mt-6 p-5 bg-black/80 backdrop-blur-md border border-emerald-500/20 rounded-3xl overflow-x-auto">
                          <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-3">Protocol Telemetry</p>
                          <pre className="text-[10px] font-mono text-emerald-400/80 leading-relaxed">{JSON.stringify(m.apiData, null, 2)}</pre>
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

      {/* Engine Deck Controls */}
      <div className="px-6 pb-10 pt-6 bg-inherit/50 backdrop-blur-xl border-t border-inherit/10">
        <div className="max-w-3xl mx-auto">
          <div className={`chat-input-container bg-inherit rounded-[2.5rem] overflow-hidden border transition-all duration-500 ${getEngineGlow()}`}>
            <div className="flex items-center gap-2 px-8 py-4 border-b border-inherit/10 overflow-x-auto no-scrollbar bg-inherit/30">
                <button onClick={() => setActiveEngine('text')} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeEngine === 'text' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'opacity-40 hover:opacity-60'}`}><i className="fas fa-font mr-2"></i>Text</button>
                <button onClick={() => setActiveEngine('image')} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeEngine === 'image' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'opacity-40 hover:opacity-60'}`}><i className="fas fa-image mr-2"></i>Image</button>
                <button onClick={() => setActiveEngine('video')} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeEngine === 'video' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'opacity-40 hover:opacity-60'}`}><i className="fas fa-video mr-2"></i>SORA 2</button>
                
                <div className="flex-1" />
                
                {activeEngine === 'image' && (
                  <div className="flex items-center gap-3">
                    <select value={imageSize} onChange={(e: any) => setImageSize(e.target.value)} className="bg-transparent text-[9px] font-black text-emerald-500 border-none outline-none focus:ring-0 cursor-pointer"><option value="1K">1K</option><option value="2K">2K</option><option value="4K">4K</option></select>
                  </div>
                )}
                {activeEngine === 'video' && (
                  <div className="flex items-center gap-3">
                    <select value={resolution} onChange={(e: any) => setResolution(e.target.value)} className="bg-transparent text-[9px] font-black text-purple-500 border-none outline-none focus:ring-0 cursor-pointer"><option value="720p">720p</option><option value="1080p">1080p</option></select>
                  </div>
                )}
                {(activeEngine === 'image' || activeEngine === 'video') && (
                  <select value={aspectRatio} onChange={(e: any) => setAspectRatio(e.target.value as any)} className={`bg-transparent text-[9px] font-black border-none outline-none focus:ring-0 cursor-pointer ${activeEngine === 'image' ? 'text-emerald-500' : 'text-purple-500'}`}><option value="1:1">1:1</option><option value="16:9">16:9</option><option value="9:16">9:16</option></select>
                )}
                <button onClick={() => setUseSearch(!useSearch)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${useSearch ? 'bg-blue-500/10 text-blue-500' : 'opacity-20'}`}><i className="fas fa-earth-americas text-xs"></i></button>
            </div>

            <div className="flex items-end gap-4 p-6">
              <input type="file" ref={fileInputRef} onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  const r = new FileReader();
                  r.onload = (ev) => setFileData({ data: ev.target?.result as string, mimeType: f.type });
                  r.readAsDataURL(f);
                }
              }} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 flex-shrink-0 flex items-center justify-center text-gray-400 hover:text-inherit hover:bg-gray-500/5 rounded-2xl transition-all"><i className="fas fa-plus text-lg"></i></button>
              <textarea ref={inputRef} value={input} onChange={(e) => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`; }} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmit())} placeholder={activeEngine === 'text' ? "Initiate reasoning protocol..." : `Describe parameters for SORA 2 synthesis...`} className="flex-1 bg-transparent border-none outline-none py-3 text-sm font-bold tracking-tight resize-none overflow-y-auto chat-scroll placeholder:opacity-30" rows={1} />
              <button onClick={handleSubmit} disabled={(!input.trim() && !fileData)} className={`w-12 h-12 flex-shrink-0 rounded-2xl flex items-center justify-center transition-all shadow-2xl ${input.trim() || fileData ? (activeEngine === 'video' ? 'bg-purple-600 text-white shadow-purple-600/30' : activeEngine === 'image' ? 'bg-emerald-600 text-white shadow-emerald-600/30' : 'bg-black text-white dark:bg-white dark:text-black') : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                <i className={`fas ${activeEngine === 'video' ? 'fa-film' : activeEngine === 'image' ? 'fa-palette' : 'fa-bolt-lightning'} text-sm`}></i>
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center mt-6 px-6">
            <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.4em]">Zaroon Unbound Engine v3.1</p>
            <div className="flex gap-4">
               {isDevMode && <p className="text-[9px] text-emerald-500 font-black uppercase animate-pulse">Telemetry: Link Optimized</p>}
               <p className={`text-[9px] font-black uppercase tracking-widest ${getEngineColor()}`}>{activeEngine === 'video' ? 'SORA 2' : activeEngine} Modality Active</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
