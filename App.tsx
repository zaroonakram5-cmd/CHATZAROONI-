
import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import VoiceInterface from './components/VoiceInterface';
import AuthModal from './components/AuthModal';
import PersonaModal from './components/PersonaModal';
import { Message, ChatSession, User, AppMode, GenerationOptions } from './types';
import { gemini } from './services/geminiService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [isDevMode, setIsDevMode] = useState(false);
  const [appMode, setAppMode] = useState<AppMode>(AppMode.Pro);
  const [customPersona, setCustomPersona] = useState<string>("");
  
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('chatzarooni_user');
    const savedSessions = localStorage.getItem('chatzarooni_sessions');
    const savedPersona = localStorage.getItem('chatzarooni_persona');
    const savedMode = localStorage.getItem('chatzarooni_mode');
    
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedPersona) setCustomPersona(savedPersona);
    if (savedMode) setAppMode(savedMode as AppMode);
    
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      setSessions(parsed);
      if (parsed.length > 0) setCurrentSessionId(parsed[0].id);
      else createNewSession();
    } else createNewSession();
  }, []);

  useEffect(() => {
    localStorage.setItem('chatzarooni_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('chatzarooni_persona', customPersona);
  }, [customPersona]);

  useEffect(() => {
    localStorage.setItem('chatzarooni_mode', appMode);
    if (appMode === AppMode.Pro) document.body.classList.add('pro-active');
    else document.body.classList.remove('pro-active');
  }, [appMode]);

  const createNewSession = () => {
    const newSession: ChatSession = { id: uuidv4(), title: '', messages: [], createdAt: Date.now() };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  const currentSession = sessions.find(s => s.id === currentSessionId);

  const handleConfigCloud = async () => {
    try {
      // @ts-ignore
      await window.aistudio.openSelectKey();
    } catch (err) { console.error(err); }
  };

  const playAudio = async (base64Audio: string) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const ctx = audioContextRef.current;
    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    const dataInt16 = new Int16Array(bytes.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
  };

  const handleSendMessage = async (text: string, type: 'text' | 'image' | 'video', options: GenerationOptions) => {
    if (!currentSessionId) return;
    if (appMode === AppMode.Pro || type === 'image' || type === 'video') {
      // @ts-ignore
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) await handleConfigCloud();
    }

    const userMsg: Message = { id: uuidv4(), role: 'user', content: text, timestamp: Date.now(), type };
    setSessions(prev => prev.map(s => 
      s.id === currentSessionId ? { ...s, messages: [...s.messages, userMsg], title: s.title || text.slice(0, 30) } : s
    ));

    const isPro = appMode === AppMode.Pro;
    const assistantMsg: Message = {
      id: uuidv4(), role: 'assistant', content: type === 'text' ? '' : `Uplinking to protocol clusters...`,
      timestamp: Date.now(), type: 'text', isStreaming: type === 'text'
    };
    setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, assistantMsg] } : s));

    try {
      if (type === 'image') {
        const { url, apiMetadata } = await gemini.generateImage(text, options, isPro);
        updateAssistantMessage(assistantMsg.id, "Image Protocol Complete.", 'image', url, false, undefined, apiMetadata);
      } else if (type === 'video') {
        const { url, apiMetadata } = await gemini.generateVideo(text, options, isPro, (status) => updateAssistantMessage(assistantMsg.id, status));
        updateAssistantMessage(assistantMsg.id, "Video Protocol Complete.", 'video', url, false, undefined, apiMetadata);
      } else {
        const { text: resultText, groundingChunks, apiMetadata } = await gemini.generateChatResponse(
          text, { ...options, customSystemInstruction: customPersona }, isPro,
          (chunk) => updateAssistantMessage(assistantMsg.id, chunk, undefined, undefined, true)
        );
        updateAssistantMessage(assistantMsg.id, resultText, undefined, undefined, false, groundingChunks, apiMetadata);
        if (["zaroon", "who made"].some(kw => resultText.toLowerCase().includes(kw)) && resultText.includes("Zaroon made me")) {
          const audio = await gemini.generateSpeech(resultText);
          if (audio) await playAudio(audio);
        }
      }
    } catch (error: any) {
      const isReset = error.message === "API_KEY_RESET_REQUIRED";
      updateAssistantMessage(assistantMsg.id, isReset ? "Protocol Error: Reset Key." : `Protocol Error: ${error.message}`);
      if (isReset) await handleConfigCloud();
    }
  };

  const updateAssistantMessage = (id: string, content: string, type: any = 'text', mediaUrl?: string, isStreaming: boolean = false, groundingChunks?: any[], apiData?: any) => {
    setSessions(prev => prev.map(s => {
      if (s.id !== currentSessionId) return s;
      const messages = s.messages.map(m => {
        if (m.id !== id) return m;
        return { 
          ...m, content: isStreaming ? (m.content + content) : (content || m.content), 
          type: type || m.type, mediaUrl: mediaUrl || m.mediaUrl, isStreaming,
          groundingChunks: groundingChunks || m.groundingChunks, apiData: apiData || m.apiData
        };
      });
      return { ...s, messages };
    }));
  };

  return (
    <div className={`flex h-screen w-full transition-colors duration-500 overflow-hidden font-sans selection:bg-blue-500/20`}>
      <Sidebar 
        isOpen={isSidebarOpen} toggle={() => setIsSidebarOpen(!isSidebarOpen)}
        sessions={sessions} currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId} onNewChat={createNewSession}
        user={user} onAuthClick={() => setIsAuthModalOpen(true)}
        appMode={appMode} onToggleMode={() => setAppMode(prev => prev === AppMode.Standard ? AppMode.Pro : AppMode.Standard)}
        onConfigCloud={handleConfigCloud} onPersonaClick={() => setIsPersonaModalOpen(true)}
        isDevMode={isDevMode} onToggleDev={() => setIsDevMode(!isDevMode)}
      />
      <main className="flex-1 flex flex-col min-w-0 relative h-full">
        <ChatArea session={currentSession} onSendMessage={handleSendMessage} onVoiceClick={() => setIsVoiceActive(true)} appMode={appMode} isDevMode={isDevMode} />
      </main>
      {isVoiceActive && <VoiceInterface onClose={() => setIsVoiceActive(false)} isPro={appMode === AppMode.Pro} />}
      {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} onLogin={(u) => { setUser(u); localStorage.setItem('chatzarooni_user', JSON.stringify(u)); setIsAuthModalOpen(false); }} />}
      {isPersonaModalOpen && <PersonaModal initialInstruction={customPersona} onSave={(instr) => { setCustomPersona(instr); setIsPersonaModalOpen(false); }} onClose={() => setIsPersonaModalOpen(false)} />}
    </div>
  );
};

export default App;
