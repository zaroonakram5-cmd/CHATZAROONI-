
import React from 'react';
import { ChatSession, User, AppMode } from '../types';

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onClearChat: () => void;
  user: User | null;
  onAuthClick: () => void;
  onProfileClick: () => void;
  onGoogleSignIn: () => void;
  appMode: AppMode;
  onToggleMode: () => void;
  onConfigCloud: () => void;
  onPersonaClick: () => void;
  isDevMode: boolean;
  onToggleDev: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  toggle, 
  sessions, 
  currentSessionId, 
  onSelectSession, 
  onNewChat,
  onClearChat,
  user,
  onAuthClick,
  onProfileClick,
  onGoogleSignIn,
  appMode,
  onToggleMode,
  onConfigCloud,
  onPersonaClick,
  isDevMode,
  onToggleDev
}) => {
  const isPro = appMode === AppMode.Pro;

  return (
    <aside className={`${isOpen ? 'w-64' : 'w-0'} ${isPro ? 'bg-[#000000]' : 'bg-[#202123]'} h-screen flex flex-col transition-all duration-300 overflow-hidden z-20 border-r border-white/10`}>
      <div className="flex flex-col h-full min-w-[16rem] p-3 space-y-2">
        <button onClick={onNewChat} className="flex items-center gap-3 w-full px-4 py-4 rounded-[1rem] border border-white/10 text-white hover:bg-gray-500/10 transition-all text-xs font-black uppercase tracking-widest mb-4 group shadow-lg">
          <i className="fas fa-plus group-hover:rotate-90 transition-transform"></i>
          <span>Initiate Session</span>
        </button>

        <div className="flex-1 overflow-y-auto chat-scroll space-y-1">
          {sessions.map(session => (
            <button key={session.id} onClick={() => onSelectSession(session.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-[0.75rem] text-xs transition-all text-left truncate group ${currentSessionId === session.id ? 'bg-[#343541] text-white' : 'text-gray-400 hover:bg-[#2A2B32] hover:text-white'}`}>
              <i className={`far fa-comment-alt text-[10px] opacity-40 group-hover:opacity-100 ${currentSessionId === session.id ? 'text-blue-400 opacity-100' : ''}`}></i>
              <span className="truncate flex-1 font-medium">{session.title || 'Recursive Thought Session'}</span>
            </button>
          ))}
        </div>

        <div className="pt-4 border-t border-white/5 space-y-1">
          <button onClick={onClearChat} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500/60 hover:text-red-500 hover:bg-red-500/5 transition-all">
            <i className="fas fa-trash-alt"></i>
            <span>Purge Memory</span>
          </button>

          <button onClick={onToggleMode} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/5 transition-all">
            <i className={`fas ${isPro ? 'fa-sparkles text-purple-500 animate-pulse' : 'fa-bolt text-yellow-500'}`}></i>
            <span>{isPro ? 'Omniscience Plus' : 'Uplink to Plus'}</span>
          </button>
          
          <button onClick={onPersonaClick} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/5 transition-all">
            <i className="fas fa-terminal opacity-40"></i>
            <span>System Persona</span>
          </button>

          <button onClick={onConfigCloud} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/5 transition-all">
            <i className="fas fa-microchip opacity-40"></i>
            <span>Engine Specs</span>
          </button>

          <div className="mt-4 pt-2">
            {!user ? (
              <button onClick={onGoogleSignIn} className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-[10px] bg-white text-black hover:bg-gray-200 transition-all font-black uppercase tracking-widest shadow-xl">
                <i className="fab fa-google text-red-500 text-sm"></i>
                <span>Sync with Google</span>
              </button>
            ) : (
              <div 
                className="px-4 py-4 flex items-center gap-4 text-white cursor-pointer bg-white/5 hover:bg-white/10 rounded-[1.25rem] group transition-all border border-white/5 hover:border-white/10" 
                onClick={onProfileClick}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-xs font-bold uppercase overflow-hidden ring-2 ring-white/10 group-hover:ring-white/20 transition-all shadow-lg">
                  {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user.username.charAt(0)}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-black truncate group-hover:text-blue-400 transition-colors uppercase tracking-tight">{user.username}</span>
                  <span className="text-[9px] opacity-40 truncate font-mono">{user.email}</span>
                </div>
                <div className="w-6 h-6 flex items-center justify-center rounded-lg bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                   <i className="fas fa-chevron-right text-[8px] opacity-40"></i>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
