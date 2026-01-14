
import React, { useState } from 'react';
import { User } from '../types';

interface AuthModalProps {
  onClose: () => void;
  onLogin: (user: User) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLogin }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email) return;

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username,
      email,
      isPro: false,
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${username}`
    };

    onLogin(newUser);
  };

  const handleGoogleMock = () => {
    const newUser: User = {
      id: 'google-' + Math.random().toString(36).substr(2, 9),
      username: 'Protocol Pilot',
      email: 'pilot@zaroon.ai',
      isPro: true,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=pilot`
    };
    onLogin(newUser);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-[#0a0a0a] rounded-[2rem] border border-white/10 p-10 shadow-[0_0_100px_rgba(59,130,246,0.15)] animate-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mb-4 python-glow">
             <i className="fas fa-fingerprint text-white text-3xl"></i>
          </div>
          <h2 className="text-3xl font-black tracking-tighter uppercase">Initialize Identity</h2>
          <p className="text-gray-500 text-sm mt-2 font-mono uppercase tracking-widest">Chatzarooni Link Protocol</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-1">alias_handle</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter alias..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-mono focus:border-blue-500 focus:bg-white/10 transition-all outline-none text-white placeholder:text-gray-800"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-1">uplink_address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@protocol.net"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-mono focus:border-blue-500 focus:bg-white/10 transition-all outline-none text-white placeholder:text-gray-800"
              required
            />
          </div>
          
          <button 
            type="submit"
            className="w-full py-5 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all transform active:scale-[0.97] shadow-2xl shadow-blue-500/20 text-white border border-blue-400/30"
          >
            Authenticate Link
          </button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="text-[9px] font-black uppercase text-gray-600 tracking-widest">OR</span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>

        <button 
          onClick={handleGoogleMock}
          className="w-full py-4 bg-white text-black hover:bg-gray-200 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3"
        >
          <i className="fab fa-google text-red-500"></i>
          Continue with Google
        </button>

        <div className="mt-10 flex flex-col items-center gap-4">
          <div className="flex gap-2">
            <div className="w-1 h-1 rounded-full bg-blue-600"></div>
            <div className="w-1 h-1 rounded-full bg-blue-600/50"></div>
            <div className="w-1 h-1 rounded-full bg-blue-600/20"></div>
          </div>
          <p className="text-[9px] text-gray-700 text-center uppercase tracking-[0.4em] font-mono leading-relaxed">
            unbound • unfiltered • encrypted
            <br/>strict_compliance: adult_content_block: active
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
