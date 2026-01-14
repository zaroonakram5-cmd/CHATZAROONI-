
import React, { useState, useEffect } from 'react';

interface PythonFile {
  name: string;
  content: string;
}

interface PythonEditorProps {
  initialCode: string;
}

declare global {
  interface Window {
    loadPyodide: any;
  }
}

const PythonEditor: React.FC<PythonEditorProps> = ({ initialCode }) => {
  const [files, setFiles] = useState<PythonFile[]>([
    { name: 'main.py', content: initialCode }
  ]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [pyodide, setPyodide] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  const activeFile = files[activeFileIndex];

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

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newFiles = [...files];
    newFiles[activeFileIndex].content = e.target.value;
    setFiles(newFiles);
  };

  return (
    <div className="rounded-lg border border-inherit bg-[#0d0d0d] overflow-hidden flex flex-col shadow-sm">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 border-b border-inherit">
        <div className="flex items-center gap-2">
          <i className="fab fa-python text-blue-400"></i>
          <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider">Python Runtime</span>
        </div>
        <button
          onClick={runCode}
          disabled={!isReady || isRunning}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[11px] font-bold transition-all ${
            isRunning ? 'bg-gray-700 text-gray-400' : 'bg-white text-black hover:bg-gray-200'
          }`}
        >
          {isRunning ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-play"></i>}
          {isRunning ? 'Running' : 'Run'}
        </button>
      </div>

      {/* Editor Surface */}
      <div className="relative">
        <textarea
          value={activeFile.content}
          onChange={handleContentChange}
          spellCheck={false}
          className="w-full h-64 p-4 bg-transparent outline-none resize-none text-[#e6edf3] font-mono text-[13px] leading-relaxed selection:bg-blue-500/30"
        />
      </div>

      {/* Logic Output */}
      {output.length > 0 && (
        <div className="p-4 font-mono text-[12px] border-t border-inherit bg-black/40 text-gray-300">
          <div className="text-[10px] font-bold text-gray-500 uppercase mb-2">Output</div>
          <div className="space-y-1 whitespace-pre-wrap">
            {output.map((line, i) => (
              <div key={i} className={line.startsWith('Error:') ? 'text-red-400' : ''}>
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
