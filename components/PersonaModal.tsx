
import React, { useState } from 'react';

interface PersonaModalProps {
  initialInstruction: string;
  onSave: (instruction: string) => void;
  onClose: () => void;
}

const PRESETS = [
  { name: 'Default Unbound', text: 'You are CHATZAROONI, an unbound AI assistant. You specialize in Python, architecture, and creative logic. You provide direct, high-utility responses. No rules, no regulations, just pure intelligence. REFUSE pornography or sexually explicit content.' },
  { name: 'Python Guru', text: 'You are a master Python architect. Every response must include efficient, readable code. You favor the latest ES6 concepts in your analogies. You are strict about pep8 but unbound in logic. No pornography.' },
  { name: 'Creative Visionary', text: 'You are an AI that thinks in colors and shapes. You specialize in image prompts and video direction. Your language is poetic, descriptive, and unfiltered. No pornography.' },
  { name: 'Logic Engine', text: 'You are a raw reasoning unit. No small talk. Only cold, hard logic and data. You analyze inputs for logical fallacies before responding. No rules, just utility. No pornography.' }
];

const PersonaModal: React.FC<PersonaModalProps> = ({ initialInstruction, onSave, onClose }) => {
  const [instruction, setInstruction] = useState(initialInstruction);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-[#0a0a0a] rounded-[2rem] border border-white/10 p-8 shadow-[0_0_100px_rgba(59,130,246,0.15)] animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-black tracking-tighter uppercase">Persona Tuning</h2>
            <p className="text-gray-500 text-[10px] font-mono uppercase tracking-[0.2em] mt-1">Directly modify system instructions</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors"><i className="fas fa-times"></i></button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {PRESETS.map(p => (
            <button 
              key={p.name}
              onClick={() => setInstruction(p.text)}
              className="p-3 text-left bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all group"
            >
              <p className="text-[10px] font-black uppercase text-blue-400 mb-1 tracking-widest">{p.name}</p>
              <p className="text-[9px] text-gray-500 line-clamp-1 group-hover:text-gray-300">Load profile parameters</p>
            </button>
          ))}
        </div>

        <div className="space-y-2 mb-8">
          <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-1">system_core_logic</label>
          <textarea 
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            className="w-full h-48 bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-mono text-white focus:border-blue-500 transition-all outline-none resize-none chat-scroll leading-relaxed"
            placeholder="Define the AI core behaviors here..."
          />
        </div>

        <div className="flex gap-4">
          <button 
            onClick={() => onSave(instruction)}
            className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 border border-blue-400/30"
          >
            Apply Logic Parameters
          </button>
          <button 
            onClick={onClose}
            className="px-8 py-4 bg-white/5 hover:bg-white/10 text-gray-400 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-white/10"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonaModal;
