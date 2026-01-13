
import React, { useState, useEffect, useRef } from 'react';

interface PythonEditorProps {
  initialCode: string;
}

declare global {
  interface Window {
    loadPyodide: any;
  }
}

const PythonEditor: React.FC<PythonEditorProps> = ({ initialCode }) => {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [pyodide, setPyodide] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initPyodide = async () => {
      if (window.loadPyodide) {
        try {
          const py = await window.loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/",
          });
          setPyodide(py);
          setIsReady(true);
        } catch (e) {
          console.error("Pyodide failed to load", e);
        }
      }
    };
    initPyodide();
  }, []);

  const runCode = async () => {
    if (!pyodide) return;
    setIsRunning(true);
    setOutput([]);
    
    // Capture stdout
    pyodide.setStdout({
      batched: (str: string) => {
        setOutput(prev => [...prev, str]);
      }
    });

    try {
      await pyodide.runPythonAsync(code);
    } catch (err: any) {
      setOutput(prev => [...prev, `Error: ${err.message}`]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="my-4 rounded-xl border border-white/10 bg-[#080808] overflow-hidden shadow-2xl flex flex-col transition-all hover:border-blue-500/30">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <i className="fab fa-python text-blue-400"></i>
          <span className="text-xs font-mono text-gray-400 font-bold tracking-widest uppercase">python_runtime_v3</span>
        </div>
        <div className="flex items-center gap-3">
          {!isReady && (
            <span className="text-[9px] text-gray-600 font-mono animate-pulse">SYSTEM_BOOTING...</span>
          )}
          <button
            onClick={runCode}
            disabled={!isReady || isRunning}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
              !isReady || isRunning 
                ? 'bg-white/5 text-gray-600 cursor-not-allowed' 
                : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/40'
            }`}
          >
            {isRunning ? (
              <i className="fas fa-circle-notch animate-spin"></i>
            ) : (
              <i className="fas fa-play text-[8px]"></i>
            )}
            {isRunning ? 'Executing' : 'Execute'}
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="relative font-mono text-sm group">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          className="w-full h-48 p-4 bg-transparent outline-none resize-none overflow-y-auto chat-scroll relative z-10 text-white selection:bg-blue-500/30 font-mono leading-relaxed"
          style={{ 
            color: 'inherit',
            WebkitTextFillColor: 'white'
          }}
        />
      </div>

      {/* Console Output */}
      <div className={`p-4 font-mono text-xs border-t border-white/5 bg-black/40 min-h-[40px] transition-all ${output.length > 0 ? 'block' : 'hidden'}`}>
        <div className="flex items-center gap-2 mb-2 text-gray-600 uppercase tracking-widest text-[9px]">
          <i className="fas fa-terminal"></i>
          <span>Console_Output</span>
        </div>
        <div className="space-y-1">
          {output.map((line, i) => (
            <div key={i} className={line.startsWith('Error:') ? 'text-red-400' : 'text-gray-300'}>
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PythonEditor;
