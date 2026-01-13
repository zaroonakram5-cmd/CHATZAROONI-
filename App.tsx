
import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import VoiceInterface from './components/VoiceInterface';
import AuthModal from './components/AuthModal';
import { Message, ChatSession, User, AppMode } from './types';
import { gemini } from './services/geminiService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [appMode, setAppMode] = useState<AppMode>(AppMode.Standard);

  // Initialize from LocalStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('chatzarooni_user');
    const savedSessions = localStorage.getItem('chatzarooni_sessions');
    const savedMode = localStorage.getItem('chatzarooni_mode');
    
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedMode) setAppMode(savedMode as AppMode);
    
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      setSessions(parsed);
      if (parsed.length > 0) setCurrentSessionId(parsed[0].id);
    } else {
      createNewSession();
    }
  }, []);

  // Persistent Savings
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('chatzarooni_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('chatzarooni_mode', appMode);
  }, [appMode]);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: uuidv4(),
      title: 'New Logic Stream',
      messages: [],
      createdAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  const handleSendMessage = async (text: string, type: 'text' | 'image' | 'video' = 'text') => {
    if (!currentSessionId) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      type
    };

    setSessions(prev => prev.map(s => 
      s.id === currentSessionId 
        ? { ...s, messages: [...s.messages, userMessage], title: s.messages.length === 0 ? text.slice(0, 30) : s.title }
        : s
    ));

    const assistantMessage: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true
    };

    setSessions(prev => prev.map(s => 
      s.id === currentSessionId ? { ...s, messages: [...s.messages, assistantMessage] } : s
    ));

    try {
      if (type === 'image') {
        const imageUrl = await gemini.generateImage(text, appMode === AppMode.Pro);
        // Set content to empty string so the reply is purely an image
        updateAssistantMessage(currentSessionId, assistantMessage.id, "", 'image', imageUrl);
      } else if (type === 'video') {
        if (appMode !== AppMode.Pro) {
          updateAssistantMessage(currentSessionId, assistantMessage.id, "Video Synthesis requires PRO access.");
          return;
        }
        const videoUrl = await gemini.generateVideo(text);
        // Set content to empty string so the reply is purely a video
        updateAssistantMessage(currentSessionId, assistantMessage.id, "", 'video', videoUrl);
      } else {
        await gemini.generateChatResponse(text, [], appMode === AppMode.Pro, (chunk) => {
          setSessions(prev => prev.map(s => {
            if (s.id === currentSessionId) {
              const updatedMessages = s.messages.map(m => 
                m.id === assistantMessage.id ? { ...m, content: m.content + chunk } : m
              );
              return { ...s, messages: updatedMessages };
            }
            return s;
          }));
        });
        
        setSessions(prev => prev.map(s => {
          if (s.id === currentSessionId) {
            const updatedMessages = s.messages.map(m => 
              m.id === assistantMessage.id ? { ...m, isStreaming: false } : m
            );
            return { ...s, messages: updatedMessages };
          }
          return s;
        }));
      }
    } catch (error: any) {
      updateAssistantMessage(currentSessionId, assistantMessage.id, `Critical Failure: ${error.message || 'Restricted content or internal error'}`);
    }
  };

  const updateAssistantMessage = (sessionId: string, messageId: string, content: string, type: any = 'text', mediaUrl?: string) => {
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        const updatedMessages = s.messages.map(m => 
          m.id === messageId ? { ...m, content, type, mediaUrl, isStreaming: false } : m
        );
        return { ...s, messages: updatedMessages };
      }
      return s;
    }));
  };

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('chatzarooni_user', JSON.stringify(u));
    setIsAuthModalOpen(false);
  };

  const currentSession = sessions.find(s => s.id === currentSessionId);

  return (
    <div className="flex h-screen bg-[#050505] text-gray-100 overflow-hidden relative">
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggle={() => setIsSidebarOpen(!isSidebarOpen)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId}
        onNewChat={createNewSession}
        user={user}
        onAuthClick={() => setIsAuthModalOpen(true)}
        appMode={appMode}
        onToggleMode={() => setAppMode(appMode === AppMode.Standard ? AppMode.Pro : AppMode.Standard)}
      />
      
      <main className="flex-1 flex flex-col transition-all duration-300">
        <ChatArea 
          session={currentSession} 
          onSendMessage={handleSendMessage}
          onVoiceClick={() => setIsVoiceActive(true)}
          appMode={appMode}
        />
      </main>

      {isVoiceActive && (
        <VoiceInterface 
          onClose={() => setIsVoiceActive(false)}
          isPro={appMode === AppMode.Pro}
        />
      )}

      {isAuthModalOpen && (
        <AuthModal 
          onClose={() => setIsAuthModalOpen(false)} 
          onLogin={handleLogin}
        />
      )}
    </div>
  );
};

export default App;
