
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
  user,
  onAuthClick,
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
        <button onClick={onNewChat} className="flex items-center gap-3 w-full px-3 py-3 rounded-md border border-white/20 text-white hover:bg-gray-500/10 transition-colors text-sm font-medium mb-4">
          <i className="fas fa-plus"></i>
          <span>New chat</span>
        </button>

        <div className="flex-1 overflow-y-auto chat-scroll space-y-1">
          {sessions.map(session => (
            <button key={session.id} onClick={() => onSelectSession(session.id)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm transition-all text-left truncate group ${currentSessionId === session.id ? 'bg-[#343541] text-white' : 'text-gray-300 hover:bg-[#2A2B32]'}`}>
              <i className="far fa-message text-xs opacity-60"></i>
              <span className="truncate flex-1">{session.title || 'Untitled Chat'}</span>
            </button>
          ))}
        </div>

        <div className="pt-2 border-t border-white/10 space-y-1">
          <button onClick={onToggleMode} className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm text-gray-300 hover:bg-gray-500/10 transition-colors">
            <i className={`fas ${isPro ? 'fa-sparkles text-purple-400' : 'fa-bolt text-yellow-400'}`}></i>
            <span>{isPro ? 'Omniscience Plus' : 'Upgrade to Plus'}</span>
          </button>
          
          <button onClick={onToggleDev} className="w-full flex items-center justify-between px-3 py-3 rounded-md text-sm text-gray-300 hover:bg-gray-500/10 transition-colors">
            <div className="flex items-center gap-3">
              <i className={`fas fa-code text-xs ${isDevMode ? 'text-emerald-400' : 'opacity-60'}`}></i>
              <span>Dev Protocol</span>
            </div>
            <div className={`w-6 h-3 rounded-full relative transition-colors ${isDevMode ? 'bg-emerald-500' : 'bg-gray-600'}`}>
              <div className={`absolute top-0.5 w-2 h-2 rounded-full bg-white transition-all ${isDevMode ? 'left-3.5' : 'left-0.5'}`}></div>
            </div>
          </button>

          <button onClick={onPersonaClick} className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm text-gray-300 hover:bg-gray-500/10 transition-colors">
            <i className="fas fa-sliders text-xs"></i>
            <span>Custom instructions</span>
          </button>

          <button onClick={onConfigCloud} className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm text-gray-300 hover:bg-gray-500/10 transition-colors">
            <i className="fas fa-key text-xs opacity-60"></i>
            <span>API Settings</span>
          </button>

          <div className="px-3 py-3 flex items-center gap-3 text-white" onClick={onAuthClick}>
            <div className="w-8 h-8 rounded-sm bg-blue-600 flex items-center justify-center text-xs font-bold uppercase">
              {user?.username?.charAt(0) || 'U'}
            </div>
            <span className="text-sm font-medium truncate">{user?.username || 'User'}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
