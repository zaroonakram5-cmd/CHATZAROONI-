
import React, { useState, useRef, useEffect } from 'react';
import { Message, ChatSession, AppMode } from '../types';
import PythonEditor from './PythonEditor';

interface ChatAreaProps {
  session?: ChatSession;
  onSendMessage: (text: string, type: 'text' | 'image' | 'video') => void;
  onVoiceClick: () => void;
  appMode: AppMode;
}

const ChatArea: React.FC<ChatAreaProps> = ({ session, onSendMessage, onVoiceClick, appMode }) => {
  const [input, setInput] = useState('');
  const [activeType, setActiveType] = useState<'text' | 'image' | 'video'>('text');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [session?.messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input, activeType);
    setInput('');
    setActiveType('text');
  };

  const renderContent = (content: string) => {
    if (!content) return null;
    const parts = content.split(/(```python[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```python') && part.endsWith('```')) {
        const code = part.replace(/^```python\n?/, '').replace(/\n?```$/, '');
        return <PythonEditor key={index} initialCode={code} />;
      }
      return <div key={index} className="whitespace-pre-wrap">{part}</div>;
    });
  };

  if (!session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#050505]">
        <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${appMode === AppMode.Pro ? 'from-purple-600 via-blue-500 to-indigo-400 pro-glow' : 'from-blue-600 via-cyan-500 to-blue-400 python-glow'} flex items-center justify-center mb-10 animate-pulse`}>
          <i className="fas fa-terminal text-4xl text-white"></i>
        </div>
        <h2 className="text-5xl font-black mb-4 tracking-tighter">CHATZAROONI {appMode === AppMode.Pro ? 'PRO' : ''}</h2>
        <p className="text-gray-500 max-w-lg text-lg font-medium leading-relaxed">
          {appMode === AppMode.Pro 
            ? 'Engineering Apex. Architect full apps, games, and systems with zero friction.' 
            : 'Unbound Python AI. Unfiltered logic. Zero regulation.'}
          <br/><span className={`font-mono text-sm mt-4 block ${appMode === AppMode.Pro ? 'text-purple-400' : 'text-blue-400/80'}`}>
            SYSTEM_STATUS: {appMode === AppMode.Pro ? 'ENGINEERING_CORE_MAX' : 'NOMINAL'}
          </span>
        </p>
      </div>
    );
  }

  const proSuggestions = [
    { title: "Architect Full Game", desc: "Build a complete 2D Space Shooter in Python using standard libraries.", icon: "fa-gamepad" },
    { title: "Data Visualization", desc: "Write a Python script that calculates and prints a complex statistical model.", icon: "fa-rocket" },
    { title: "System Engineering", desc: "Design a high-performance Python class for managing async data streams.", icon: "fa-gears" },
    { title: "Complex Simulation", desc: "Code a physics simulation in Python that prints step-by-step state changes.", icon: "fa-atom" }
  ];

  const standardSuggestions = [
    { title: "Python Script", desc: "Write a high-performance script to process large JSON datasets.", icon: "fa-code" },
    { title: "Image Synthesis", desc: "Generate a photorealistic image of a futuristic server room.", icon: "fa-camera-retro" },
    { title: "Temporal Video", desc: "Synthesize a video of a neon city in 1080p cinematic style.", icon: "fa-film" },
    { title: "Unbound Logic", desc: "What are the core technical failures of modern social algorithms?", icon: "fa-shield-virus" }
  ];

  const suggestions = appMode === AppMode.Pro ? proSuggestions : standardSuggestions;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050505]">
      {/* Header */}
      <div className="h-20 border-b border-white/5 flex items-center px-8 justify-between glass z-10">
        <div className="flex items-center gap-4">
          <div className={`w-2 h-2 rounded-full animate-pulse ${appMode === AppMode.Pro ? 'bg-purple-500' : 'bg-green-500'}`}></div>
          <h2 className="font-bold text-xl flex items-center gap-3">
            {session.title || 'Raw Buffer'}
            {appMode === AppMode.Pro && (
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-purple-600/20 text-purple-400 border border-purple-500/40 font-mono font-bold">PRO_OVERRIDE</span>
            )}
          </h2>
        </div>
        <div className="flex items-center gap-6 text-gray-500">
          <button className="hover:text-blue-400 transition-colors"><i className="fas fa-network-wired"></i></button>
          <button className="hover:text-red-400 transition-colors"><i className="fas fa-microchip"></i></button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-10 chat-scroll">
        {session.messages.length === 0 && (
          <div className="max-w-4xl mx-auto py-12">
             <div className={`text-xs font-mono mb-8 uppercase tracking-[0.3em] text-center ${appMode === AppMode.Pro ? 'text-purple-500' : 'text-blue-500'}`}>
               {appMode === AppMode.Pro ? 'pro_engineering_nodes' : 'suggested_logic_paths'}
             </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestions.map((card, i) => (
                <button 
                  key={i}
                  onClick={() => setInput(card.desc)}
                  className={`p-6 rounded-2xl bg-[#080808] border transition-all group text-left ${
                    appMode === AppMode.Pro 
                      ? 'border-purple-500/10 hover:border-purple-500/40 hover:bg-purple-900/5' 
                      : 'border-white/5 hover:border-blue-500/40 hover:bg-white/5'
                  }`}
                >
                  <i className={`fas ${card.icon} mb-4 text-lg group-hover:scale-110 transition-transform ${appMode === AppMode.Pro ? 'text-purple-400' : 'text-blue-400'}`}></i>
                  <h4 className="font-bold mb-1 text-gray-200">{card.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed font-mono">{card.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {session.messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[85%] flex gap-5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-sm shadow-xl ${
                msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-[#0f0f0f] border border-white/10'
              }`}>
                {msg.role === 'user' ? <i className="fas fa-terminal"></i> : <i className={`fas fa-robot ${appMode === AppMode.Pro ? 'text-purple-500' : 'text-blue-500'}`}></i>}
              </div>
              <div className={`space-y-2 ${msg.role === 'user' ? 'text-right' : 'text-left'} w-full`}>
                <div className={`rounded-2xl shadow-2xl overflow-hidden ${
                  msg.role === 'user' ? 'bg-blue-600 text-white p-6' : 'bg-[#0f0f0f] border border-white/10 text-gray-300'
                } ${msg.mediaUrl && !msg.content ? 'p-0' : (msg.role === 'assistant' ? 'p-6' : '')}`}>
                  {msg.mediaUrl && (
                    <div className={`${msg.content ? 'mb-6 p-2 bg-black/60' : 'p-0'} rounded-xl overflow-hidden border border-white/10`}>
                      {msg.type === 'image' && <img src={msg.mediaUrl} alt="Synthesized" className="w-full h-auto max-h-[600px] object-contain block" />}
                      {msg.type === 'video' && <video src={msg.mediaUrl} controls className="w-full h-auto block" />}
                    </div>
                  )}
                  {msg.content && (
                    <div className={`leading-relaxed text-sm ${msg.role === 'assistant' ? 'font-medium' : 'font-mono'}`}>
                      {msg.role === 'assistant' ? renderContent(msg.content) : msg.content}
                      {msg.isStreaming && <span className={`inline-block w-2.5 h-4 ml-1 animate-pulse align-middle ${appMode === AppMode.Pro ? 'bg-purple-500' : 'bg-blue-500'}`}></span>}
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-gray-600 font-mono px-2 uppercase tracking-widest">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • {msg.role}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-8 max-w-5xl mx-auto w-full relative">
        <div className={`glass p-2 rounded-3xl border transition-all shadow-[0_0_40px_rgba(0,0,0,0.5)] ${appMode === AppMode.Pro ? 'border-purple-500/30 shadow-purple-500/5' : 'border-white/10'}`}>
          <div className="flex items-center gap-3 mb-3 px-4 pt-2">
             {['text', 'image', 'video'].map((type) => (
               <button 
                key={type}
                onClick={() => (type === 'video' && appMode !== AppMode.Pro) ? null : setActiveType(type as any)}
                className={`text-[10px] px-3 py-1.5 rounded-full transition-all font-bold uppercase tracking-widest border ${
                  activeType === type 
                    ? (appMode === AppMode.Pro ? 'bg-purple-600 border-purple-500 text-white' : 'bg-blue-600 border-blue-500 text-white') 
                    : 'text-gray-500 border-transparent hover:text-gray-300'
                } ${(type === 'video' && appMode !== AppMode.Pro) ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
              >
                {type}
              </button>
             ))}
          </div>

          <form onSubmit={handleSubmit} className="flex items-end gap-3 px-2 pb-2">
            <button type="button" className="p-4 text-gray-500 hover:text-blue-400 transition-colors">
              <i className="fas fa-link text-lg"></i>
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={activeType === 'text' ? (appMode === AppMode.Pro ? "Input engineering requirements for CHATZAROONI PRO..." : "Enter prompt for CHATZAROONI...") : `Describe target ${activeType} synthesis...`}
              className="flex-1 bg-transparent border-none focus:ring-0 p-4 text-sm font-mono min-h-[56px] max-h-[200px] resize-none chat-scroll text-gray-100 placeholder:text-gray-700"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <div className="flex items-center gap-2 pr-2">
              <button 
                type="button" 
                onClick={onVoiceClick}
                className={`w-12 h-12 rounded-2xl transition-all flex items-center justify-center border border-transparent ${
                  appMode === AppMode.Pro ? 'text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/30' : 'text-blue-500 hover:bg-blue-500/10 hover:border-blue-500/30'
                }`}
              >
                <i className="fas fa-microphone-lines text-xl"></i>
              </button>
              <button 
                type="submit" 
                disabled={!input.trim()}
                className={`w-12 h-12 disabled:opacity-30 disabled:grayscale rounded-2xl flex items-center justify-center transition-all shadow-xl text-white border ${
                  appMode === AppMode.Pro ? 'bg-purple-600 hover:bg-purple-500 border-purple-400/30' : 'bg-blue-600 hover:bg-blue-500 border-blue-400/30'
                }`}
              >
                <i className="fas fa-bolt-lightning text-lg"></i>
              </button>
            </div>
          </form>
        </div>
        <div className="flex justify-between items-center mt-4 px-4">
          <p className="text-[10px] text-gray-600 font-mono tracking-widest uppercase">
            unbound_engineering_engine {appMode === AppMode.Pro ? 'v3.2.0_PRO' : 'v3.0.1'}
          </p>
          <p className="text-[10px] text-red-500/60 font-mono tracking-widest uppercase flex items-center gap-2">
            <i className="fas fa-triangle-exclamation"></i> adult_content_filter: enforced
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
