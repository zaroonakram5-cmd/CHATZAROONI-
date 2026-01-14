
import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface ProfileModalProps {
  user: User;
  onSave: (updatedUser: User) => void;
  onLogout: () => void;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, onSave, onLogout, onClose }) => {
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState('Senior Protocol Intelligence Pilot.');
  const [avatarSeed, setAvatarSeed] = useState(user.avatar.includes('seed=') ? user.avatar.split('seed=')[1] : user.username);
  const [previewAvatar, setPreviewAvatar] = useState(user.avatar);

  useEffect(() => {
    setPreviewAvatar(`https://api.dicebear.com/7.x/identicon/svg?seed=${avatarSeed || 'zaroon'}`);
  }, [avatarSeed]);

  const handleSave = () => {
    const updatedUser: User = {
      ...user,
      username,
      avatar: previewAvatar
    };
    onSave(updatedUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-xl bg-[#0a0a0a] rounded-[2.5rem] border border-white/10 overflow-hidden shadow-[0_0_100px_rgba(59,130,246,0.1)] animate-in zoom-in-95 duration-300">
        {/* Decorative Header */}
        <div className="h-32 bg-gradient-to-r from-blue-600/20 to-purple-600/20 relative border-b border-white/5">
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden opacity-20">
            <div className="w-full h-full flex flex-wrap gap-1 font-mono text-[8px] text-blue-500 select-none">
              {Array(20).fill("0101101010010101010101010101010101010101").join(" ")}
            </div>
          </div>
          <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white/50 hover:text-white hover:bg-black/60 transition-all border border-white/10">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="px-10 pb-12 -mt-16">
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className="w-32 h-32 rounded-[2.5rem] bg-blue-600 p-1 overflow-hidden shadow-2xl transition-transform hover:scale-105 border-4 border-[#0a0a0a]">
                <img src={previewAvatar} alt="Avatar Preview" className="w-full h-full rounded-[2.2rem] object-cover bg-black" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-blue-500 flex items-center justify-center border-4 border-[#0a0a0a] shadow-xl">
                <i className="fas fa-camera text-xs text-white"></i>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <h2 className="text-2xl font-black tracking-tight uppercase italic">{username || 'Anonymous'}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-full">Protocol Level: 09</span>
                <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest bg-purple-500/10 px-2 py-0.5 rounded-full">Uplink Status: Unbound</span>
              </div>
            </div>
          </div>

          <div className="mt-10 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] px-1">protocol_alias</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm font-mono focus:border-blue-500 focus:bg-white/10 transition-all outline-none text-white placeholder:text-gray-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] px-1">neural_seed</label>
                <input 
                  type="text" 
                  value={avatarSeed}
                  onChange={(e) => setAvatarSeed(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm font-mono focus:border-blue-500 focus:bg-white/10 transition-all outline-none text-white"
                  placeholder="Avatar randomness..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] px-1">identity_bio</label>
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm font-mono focus:border-blue-500 focus:bg-white/10 transition-all outline-none text-white resize-none h-24"
              />
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <button 
                onClick={handleSave}
                className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-2xl shadow-blue-500/20 border border-blue-400/30"
              >
                Sync Data Parameters
              </button>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={onLogout}
                  className="py-4 bg-white/5 hover:bg-red-500/10 text-gray-500 hover:text-red-500 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all border border-white/5 hover:border-red-500/20"
                >
                  Terminate Link
                </button>
                <button 
                  onClick={onClose}
                  className="py-4 bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all border border-white/5"
                >
                  Retain Current State
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
