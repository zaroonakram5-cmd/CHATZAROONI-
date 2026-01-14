
import React, { useState } from 'react';
import { User } from '../types';

interface ProfileModalProps {
  user: User;
  onSave: (updatedUser: User) => void;
  onLogout: () => void;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, onSave, onLogout, onClose }) => {
  const [username, setUsername] = useState(user.username);
  const [avatarSeed, setAvatarSeed] = useState(user.avatar.includes('seed=') ? user.avatar.split('seed=')[1] : user.username);

  const handleSave = () => {
    const updatedUser: User = {
      ...user,
      username,
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${avatarSeed}`
    };
    onSave(updatedUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-[#0a0a0a] rounded-[2rem] border border-white/10 p-10 shadow-[0_0_100px_rgba(59,130,246,0.15)] animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-black tracking-tighter uppercase italic">User Protocol</h2>
            <p className="text-gray-500 text-[10px] font-mono uppercase tracking-[0.2em] mt-1">Identity Management Subsystem</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl transition-colors"><i className="fas fa-times"></i></button>
        </div>

        <div className="flex flex-col items-center mb-10 group">
          <div className="relative">
            <div className="w-24 h-24 rounded-[2rem] bg-blue-600 flex items-center justify-center overflow-hidden border-2 border-white/5 shadow-2xl transition-transform group-hover:scale-105">
              <img 
                src={`https://api.dicebear.com/7.x/identicon/svg?seed=${avatarSeed}`} 
                alt="Avatar" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center border-4 border-[#0a0a0a]">
              <i className="fas fa-pen text-[10px] text-white"></i>
            </div>
          </div>
          <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-blue-500">Neural Seed Active</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-1">protocol_alias</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-mono focus:border-blue-500 focus:bg-white/10 transition-all outline-none text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-1">avatar_seed</label>
            <input 
              type="text" 
              value={avatarSeed}
              onChange={(e) => setAvatarSeed(e.target.value)}
              placeholder="Random seed..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-mono focus:border-blue-500 focus:bg-white/10 transition-all outline-none text-white"
            />
          </div>

          <div className="pt-4 space-y-4">
            <button 
              onClick={handleSave}
              className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 border border-blue-400/30"
            >
              Update Identity
            </button>
            <button 
              onClick={onLogout}
              className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border border-red-500/20"
            >
              Terminate Session (Logout)
            </button>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col items-center gap-2">
          <p className="text-[9px] text-gray-700 font-mono tracking-widest uppercase">Uplink: {user.email}</p>
          <p className="text-[9px] text-gray-800 font-mono tracking-[0.4em] uppercase">UID: {user.id}</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
