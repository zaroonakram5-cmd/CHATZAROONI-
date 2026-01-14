
import React, { useState, useEffect } from 'react';
import { ChatSession, User, AppMode } from '../types';

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  user: User | null;
  onAuthClick: () => void;
  appMode: AppMode;
  onToggleMode: () => void;
  onConfigCloud: () => void;
  onPersonaClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  toggle, 
  sessions, 
  currentSessionId, 
  onSelectSession, 
  onNewChat,
  user,
  onAuthClick,
  appMode,
  onToggleMode,
  onConfigCloud,
  onPersonaClick
}) => {
  const isPro = appMode === AppMode.Pro;
  const [stats, setStats] = useState({ load: 42, latency: 12, throughput: 1.2 });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats({
        load: Math.floor(Math.random() * (isPro ? 20 : 5)) + (isPro ? 80 : 10),
        latency: Math.floor(Math.random() * (isPro ? 50 : 200)) + (isPro ? 10 : 80),
        throughput: parseFloat((Math.random() * (isPro ? 10 : 2) + (isPro ? 5 : 0.5)).toFixed(1))
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [isPro]);

  return (
    <aside className={`${isOpen ? 'w-80' : 'w-0'} ${isPro ? 'bg-[#050505]' : 'bg-[#1e1f20]'} h-screen flex flex-col transition-all duration-300 overflow-hidden z-20 border-r ${isPro ? 'border-red-600/60' : 'border-white/5'} shadow-2xl`}>
      <div className="flex flex-col h-full min-w-[20rem] py-6">
        {/* Branding & Status */}
        <div className="px-6 mb-8">
          <div className="flex items-center justify-between mb-10">
            <button 
              onClick={toggle}
              className={`p-3 rounded-2xl transition-all ${isPro ? 'hover:bg-red-900/20 text-red-600' : 'hover:bg-[#3c4043] text-[#e3e3e3]'}`}
            >
              <i className="fas fa-bars-staggered text-xl"></i>
            </button>
            <div className="flex flex-col items-end">
              <span className={`text-[9px] font-black uppercase tracking-[0.4em] mb-1 ${isPro ? 'text-red-500 animate-pulse' : 'text-blue-400'}`}>
                {isPro ? 'UNRESTRICTED_CORE_ACTIVE' : 'UPLINK_STABLE'}
              </span>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`w-3 h-1 rounded-full ${isPro ? (i < 4 ? 'bg-red-600' : 'bg-red-950') : (i < 2 ? 'bg-blue-600' : 'bg-gray-800')}`}></div>
                ))}
              </div>
            </div>
          </div>

          <button 
            onClick={onNewChat}
            className={`group relative flex items-center justify-center gap-3 w-full py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] transition-all overflow-hidden ${
              isPro 
              ? 'bg-red-600 text-white hover:bg-red-500 shadow-[0_0_30px_rgba(255,0,0,0.4)] border border-red-400' 
              : 'bg-[#131314] hover:bg-white hover:text-black border border-white/5 text-white'
            }`}
          >
            <i className="fas fa-skull text-lg group-hover:rotate-12 transition-transform"></i>
            <span>Init Unbound Stream</span>
          </button>
        </div>

        {/* Diagnostics Panel (Ultra Mode Only) */}
        {isPro && (
          <div className="px-6 mb-8 animate-in fade-in slide-in-from-left-4 duration-1000">
            <div className="p-5 rounded-3xl bg-red-950/20 border border-red-600/40 space-y-4">
              <p className="text-[8px] font-black text-red-500 uppercase tracking-[0.3em] flex items-center gap-2">
                <i className="fas fa-biohazard animate-spin-slow"></i> Bypass_Level: Absolute
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-red-500/60 font-bold uppercase">Anarchy Index</p>
                  <p className="text-xl font-mono text-red-400 font-black">MAX</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-red-500/60 font-bold uppercase">Uplink</p>
                  <p className="text-xl font-mono text-red-400 font-black">RAW</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Historical Logs */}
        <div className="flex-1 overflow-y-auto chat-scroll px-3 space-y-2">
          <div className={`px-4 text-[9px] font-black uppercase tracking-[0.4em] mb-4 flex items-center gap-3 ${isPro ? 'text-red-600' : 'text-gray-600'}`}>
            <span className="flex-1 h-px bg-current opacity-20"></span>
            Raw_Buffer_Logs
            <span className="flex-1 h-px bg-current opacity-20"></span>
          </div>
          {sessions.map(session => (
            <button
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[13px] transition-all text-left truncate group border ${
                currentSessionId === session.id 
                  ? (isPro ? 'bg-red-600/20 text-red-400 border-red-600/50 shadow-[0_0_15px_rgba(255,0,0,0.1)]' : 'bg-white/10 text-white border-white/10') 
                  : (isPro ? 'text-red-900/40 hover:text-red-400 hover:bg-red-950/20 border-transparent' : 'text-gray-500 hover:bg-[#3c4043] border-transparent')
              }`}
            >
              <i className={`fas fa-ghost text-[10px] ${currentSessionId === session.id ? 'opacity-100' : 'opacity-20 group-hover:opacity-100'}`}></i>
              <span className="truncate font-bold tracking-tight">{session.title || 'NULL_LOG'}</span>
            </button>
          ))}
        </div>

        {/* Bottom Override Console */}
        <div className={`mt-auto px-6 space-y-3 pt-8 border-t ${isPro ? 'border-red-600/40' : 'border-[#3c4043]'}`}>
          <button 
            onClick={onPersonaClick}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isPro ? 'text-red-500 hover:bg-red-950/40' : 'text-gray-400 hover:bg-white/5'}`}
          >
            <i className="fas fa-radiation text-sm"></i>
            <span>Override Logic</span>
          </button>

          <button 
            onClick={onToggleMode}
            className={`relative w-full flex items-center justify-between px-6 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all border overflow-hidden ${
                isPro 
                ? 'bg-red-600 text-white border-red-400 shadow-[0_0_40px_rgba(255,0,0,0.4)]' 
                : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-3 z-10">
              <i className={`fas ${isPro ? 'fa-triangle-exclamation animate-pulse' : 'fa-bolt'}`}></i>
              <span>{isPro ? 'UNRESTRICTED CORE' : 'Standard Logic'}</span>
            </div>
            {isPro && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
            )}
          </button>

          <button 
            onClick={onConfigCloud}
            className={`w-full text-center py-2 text-[8px] font-black uppercase tracking-[0.5em] transition-opacity ${isPro ? 'text-red-950 hover:text-red-500' : 'text-gray-800 hover:text-gray-600'}`}
          >
            Reset Uplink Credentials
          </button>
        </div>
      </div>
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-spin-slow {
          animation: spin 6s linear infinite;
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
