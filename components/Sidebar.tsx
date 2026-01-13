
import React from 'react';
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
  onToggleMode
}) => {
  return (
    <aside className={`${isOpen ? 'w-80' : 'w-0'} bg-[#080808] border-r border-white/5 flex flex-col transition-all duration-300 overflow-hidden shadow-2xl z-20`}>
      <div className="p-5 flex flex-col h-full min-w-[20rem]">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${appMode === AppMode.Pro ? 'from-purple-600 to-blue-500 pro-glow' : 'from-blue-600 to-cyan-500 python-glow'} flex items-center justify-center`}>
              <i className="fas fa-terminal text-white text-lg"></i>
            </div>
            <div>
              <span className="font-black text-2xl tracking-tighter block leading-none">CHATZAROONI</span>
              <span className="text-[10px] text-blue-400 font-mono tracking-widest uppercase">Unbound Python AI</span>
            </div>
          </div>
          <button onClick={toggle} className="text-gray-600 hover:text-white transition-colors">
            <i className="fas fa-angles-left"></i>
          </button>
        </div>

        <button 
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 mb-8 transition-all group hover:border-blue-500/50"
        >
          <i className="fas fa-plus-circle text-blue-500 group-hover:rotate-90 transition-transform"></i>
          <span className="font-semibold text-sm">Initialize New Session</span>
        </button>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-2 chat-scroll">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] px-3 mb-3">Memory Banks</h3>
          {sessions.map(session => (
            <button
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`w-full text-left p-3.5 rounded-xl text-sm transition-all truncate border ${
                currentSessionId === session.id ? 'bg-blue-600/10 border-blue-500/30 text-white' : 'text-gray-500 border-transparent hover:bg-white/5 hover:text-gray-300'
              }`}
            >
              <i className={`fas fa-code-commit mr-3 text-xs opacity-40`}></i>
              {session.title || 'Raw Stream'}
            </button>
          ))}
        </div>

        <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
          <div className={`p-5 rounded-2xl transition-all border ${appMode === AppMode.Pro ? 'bg-purple-900/10 border-purple-500/30' : 'bg-white/5 border-white/10'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-bold uppercase tracking-widest ${appMode === AppMode.Pro ? 'text-purple-400' : 'text-blue-400'}`}>
                {appMode === AppMode.Pro ? 'Pro Status: ACTIVE' : 'Upgrade to Pro'}
              </span>
              <button 
                onClick={onToggleMode}
                className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors ${appMode === AppMode.Pro ? 'bg-purple-600' : 'bg-gray-700'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${appMode === AppMode.Pro ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
            <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
              Access Gemini 3 Pro, high-res image synthesis, and temporal video generation.
            </p>
          </div>

          <button 
            onClick={onAuthClick}
            className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-white/5 transition-all text-left border border-transparent hover:border-white/10"
          >
            <div className="w-11 h-11 rounded-full bg-gray-900 flex items-center justify-center overflow-hidden border border-white/10 shadow-inner">
              {user ? (
                <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
              ) : (
                <i className="fas fa-ghost text-gray-600"></i>
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{user ? user.username : 'Guest_Infiltrator'}</p>
              <p className="text-[10px] text-gray-500 font-mono">{user ? user.email : 'No data link active'}</p>
            </div>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
