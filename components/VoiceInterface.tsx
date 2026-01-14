
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

interface VoiceInterfaceProps {
  onClose: () => void;
  isPro: boolean;
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ onClose, isPro }) => {
  const [status, setStatus] = useState<'connecting' | 'listening' | 'speaking' | 'error'>('connecting');
  const [transcription, setTranscription] = useState('');
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const createBlob = (data: Float32Array) => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) int16[i] = data[i] * 32768;
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  useEffect(() => {
    const startSession = async () => {
      try {
        // Fix: Strictly use process.env.API_KEY as per named parameter requirement
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          callbacks: {
            onopen: () => {
              setStatus('listening');
              const source = inputAudioContext.createMediaStreamSource(stream);
              const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = createBlob(inputData);
                // Ensure sendRealtimeInput is called only after the session resolves to prevent race conditions
                sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
              };
              source.connect(scriptProcessor);
              scriptProcessor.connect(inputAudioContext.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
              if (message.serverContent?.outputTranscription) {
                setTranscription(prev => prev + message.serverContent!.outputTranscription!.text);
              }

              const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              if (audioData && audioContextRef.current) {
                setStatus('speaking');
                const ctx = audioContextRef.current;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.onended = () => {
                  sourcesRef.current.delete(source);
                  if (sourcesRef.current.size === 0) setStatus('listening');
                };
                // Scheduling for gapless playback using running nextStartTime timestamp
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                sourcesRef.current.add(source);
              }

              if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => { try { s.stop(); } catch(e){} });
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
                setStatus('listening');
              }
            },
            onerror: (e) => {
              console.error(e);
              setStatus('error');
            },
            onclose: () => onClose()
          },
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: isPro ? 'Fenrir' : 'Puck' } }
            },
            systemInstruction: "You are CHATZAROONI. This is a voice session. Be direct, unfiltered, and helpful. No pornographic suggestions. Focus on high-quality conversation."
          }
        });

        sessionRef.current = await sessionPromise;
      } catch (err) {
        console.error(err);
        setStatus('error');
      }
    };

    startSession();

    return () => {
      if (sessionRef.current) sessionRef.current.close();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [isPro, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-[#050505]/98 backdrop-blur-3xl flex flex-col items-center justify-center p-8">
      <div className="absolute top-10 right-10">
        <button onClick={onClose} className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all border border-white/10 text-gray-400 hover:text-white">
          <i className="fas fa-xmark text-2xl"></i>
        </button>
      </div>

      <div className="flex flex-col items-center gap-16 max-w-3xl w-full text-center">
        <div className="relative">
          <div className={`w-40 h-40 rounded-[2.5rem] flex items-center justify-center border-2 transition-all duration-700 ${
            status === 'speaking' ? 'border-blue-500 shadow-[0_0_80px_rgba(59,130,246,0.6)] scale-110 rotate-45' : 
            status === 'listening' ? 'border-cyan-500 shadow-[0_0_50px_rgba(6,182,212,0.3)]' : 'border-gray-800'
          }`}>
            <i className={`fas fa-bolt-lightning text-5xl transition-all duration-500 ${status === 'speaking' ? 'text-blue-400 -rotate-45' : 'text-gray-700'}`}></i>
          </div>
          {status === 'speaking' && (
            <div className="absolute -inset-10 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 rounded-full border-2 border-blue-500/10 animate-ping"></div>
              <div className="absolute w-72 h-72 rounded-full border border-cyan-500/5 animate-pulse"></div>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-4xl font-black mb-6 tracking-tighter uppercase italic">
            {status === 'connecting' && 'Establishing Uplink...'}
            {status === 'listening' && "Awaiting Audio Input"}
            {status === 'speaking' && 'Transmitting Data'}
            {status === 'error' && 'Link Failure'}
          </h2>
          <div className="bg-white/5 border border-white/5 rounded-2xl p-6 min-h-[100px] w-full shadow-inner">
            <p className="text-gray-400 text-lg font-mono leading-relaxed">
              {transcription || "System ready. Transcribe session active..."}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          {[...Array(8)].map((_, i) => (
            <div 
              key={i} 
              className={`w-2 rounded-full transition-all duration-200 ${
                status === 'speaking' ? 'bg-blue-500 animate-bounce' : 
                status === 'listening' ? 'bg-cyan-500 h-8 opacity-40' : 'bg-gray-800 h-4'
              }`}
              style={{ 
                height: status === 'speaking' ? `${20 + Math.random() * 40}px` : undefined,
                animationDelay: `${i * 0.1}s` 
              }}
            ></div>
          ))}
        </div>
        
        <p className="text-[10px] text-gray-700 font-mono tracking-[0.4em] uppercase">
          chatzarooni_vocal_interface_active
        </p>
      </div>
    </div>
  );
};

export default VoiceInterface;
