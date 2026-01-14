
import React, { useState, useEffect, useRef } from 'react';

interface PythonFile {
  name: string;
  content: string;
}

interface PythonEditorProps {
  initialCode: string;
  overrideCode?: string | null;
  onCodeConsumed?: () => void;
}

declare global {
  interface Window {
    loadPyodide: any;
  }
}

const PythonEditor: React.FC<PythonEditorProps> = ({ initialCode, overrideCode, onCodeConsumed }) => {
  const [files, setFiles] = useState<PythonFile[]>([
    { name: 'main.py', content: initialCode }
  ]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [pyodide, setPyodide] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [editingFileName, setEditingFileName] = useState<number | null>(null);
  const [tempFileName, setTempFileName] = useState('');

  const activeFile = files[activeFileIndex];

  useEffect(() => {
    if (overrideCode) {
        const newFiles = [...files];
        newFiles[activeFileIndex].content = overrideCode;
        setFiles(newFiles);
        onCodeConsumed?.();
    }
  }, [overrideCode]);

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
    
    pyodide.setStdout({
      batched: (str: string) => {
        setOutput(prev => [...prev, str]);
      }
    });

    try {
      files.forEach(file => {
        pyodide.FS.writeFile(file.name, file.content);
      });
      await pyodide.runPythonAsync(activeFile.content);
    } catch (err: any) {
      setOutput(prev => [...prev, `Error: ${err.message}`]);
    } finally {
      setIsRunning(false);
    }
  };

  const addFile = () => {
    const newName = `module_${files.length}.py`;
    setFiles([...files, { name: newName, content: '' }]);
    setActiveFileIndex(files.length);
  };

  const deleteFile = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (files.length <= 1) return;
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    if (activeFileIndex >= index) {
      setActiveFileIndex(Math.max(0, activeFileIndex - 1));
    }
  };

  const startRenaming = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFileName(index);
    setTempFileName(files[index].name);
  };

  const handleRename = () => {
    if (editingFileName === null) return;
    if (tempFileName.trim() === '') {
      setEditingFileName(null);
      return;
    }
    
    let finalName = tempFileName.trim();
    if (!finalName.endsWith('.py')) finalName += '.py';

    const newFiles = [...files];
    newFiles[editingFileName].name = finalName;
    setFiles(newFiles);
    setEditingFileName(null);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newFiles = [...files];
    newFiles[activeFileIndex].content = e.target.value;
    setFiles(newFiles);
  };

  return (
    <div className="my-10 rounded-3xl border border-red-900/30 bg-[#0a0a0a] overflow-hidden flex flex-col shadow-2xl shadow-red-950/20 group/editor">
      {/* IDE Header */}
      <div className="flex flex-col bg-black/40 border-b border-red-900/20">
        <div className="flex items-center justify-between px-6 py-4 border-b border-red-900/10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
            <span className="text-[10px] font-black text-red-900 uppercase tracking-[0.3em]">Logic_Sandbox_Environment</span>
          </div>
          <div className="flex items-center gap-4">
            {!isReady && (
              <span className="text-[9px] text-red-900 font-mono animate-pulse uppercase">Linking Core Kernel...</span>
            )}
            <button
              onClick={runCode}
              disabled={!isReady || isRunning}
              className={`flex items-center gap-3 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                !isReady || isRunning 
                  ? 'bg-transparent text-red-950 cursor-not-allowed border border-red-950/20' 
                  : 'bg-red-600 text-white hover:bg-red-500 shadow-[0_0_20px_rgba(255,0,0,0.3)]'
              }`}
            >
              {isRunning ? <i className="fas fa-dna animate-spin"></i> : <i className="fas fa-play"></i>}
              {isRunning ? 'Synthesizing' : 'Execute Logic'}
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center overflow-x-auto chat-scroll bg-black/20">
          {files.map((file, index) => (
            <div
              key={index}
              onClick={() => setActiveFileIndex(index)}
              className={`flex items-center gap-3 px-6 py-3.5 text-xs font-bold border-r border-red-900/10 cursor-pointer transition-all min-w-[150px] group ${
                activeFileIndex === index 
                  ? 'bg-red-950/10 text-red-500 border-b-2 border-red-600' 
                  : 'text-red-900/50 hover:bg-red-950/5 hover:text-red-700'
              }`}
            >
              <i className="fas fa-code text-[10px] opacity-70"></i>
              {editingFileName === index ? (
                <input
                  autoFocus
                  className="bg-black text-red-500 outline-none px-2 rounded border border-red-600/50 w-full"
                  value={tempFileName}
                  onChange={(e) => setTempFileName(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="truncate flex-1" onDoubleClick={(e) => startRenaming(index, e)}>
                  {file.name}
                </span>
              )}
              
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => startRenaming(index, e)} className="hover:text-red-400 p-1"><i className="fas fa-pen text-[9px]"></i></button>
                {files.length > 1 && <button onClick={(e) => deleteFile(index, e)} className="hover:text-red-400 p-1"><i className="fas fa-times text-[9px]"></i></button>}
              </div>
            </div>
          ))}
          <button onClick={addFile} className="px-6 py-3.5 text-red-900/50 hover:text-red-600 hover:bg-red-950/5 transition-colors"><i className="fas fa-plus text-sm"></i></button>
        </div>
      </div>

      {/* Editor Surface */}
      <div className="relative p-0 bg-black/40">
        <textarea
          value={activeFile.content}
          onChange={handleContentChange}
          spellCheck={false}
          className="w-full h-80 p-6 bg-transparent outline-none resize-none overflow-y-auto chat-scroll text-red-500 font-mono text-[13px] leading-relaxed selection:bg-red-500/20"
          placeholder={`# Enter unconstrained logic for ${activeFile.name}...`}
        />
        <div className="absolute top-4 right-6 text-[8px] font-black text-red-900/30 uppercase tracking-[0.4em] pointer-events-none">
          Live_Runtime_Buffer
        </div>
      </div>

      {/* Logic Output */}
      {output.length > 0 && (
        <div className="p-6 font-mono text-[13px] border-t border-red-900/20 bg-black/60">
          <div className="flex items-center gap-3 mb-4 text-red-900 uppercase text-[9px] font-black tracking-[0.3em]">
            <i className="fas fa-terminal animate-pulse"></i>
            <span>System_Output_Stream</span>
          </div>
          <div className="space-y-1 overflow-x-auto whitespace-pre">
            {output.map((line, i) => (
              <div key={i} className={line.startsWith('Error:') ? 'text-red-600 bg-red-600/5 p-1 rounded border-l-2 border-red-600' : 'text-red-400/80 px-2'}>
                {line}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PythonEditor;
