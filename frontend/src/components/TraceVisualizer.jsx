import React, { useState } from 'react';
import { Cpu, ChevronRight, ChevronDown, CheckCircle2, Wrench } from 'lucide-react';

export default function TraceVisualizer({ traces = [] }) {
  const [isOpen, setIsOpen] = useState(true);

  if (!traces || traces.length === 0) return null;

  return (
    <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 my-3 backdrop-blur-md">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-rose-500 animate-pulse" />
          <span>Agentic Plan-Act Trace ({traces.length} step{traces.length > 1 ? 's' : ''})</span>
        </div>
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="mt-3 space-y-2.5">
          {traces.map((trace, idx) => (
            <div
              key={idx}
              className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs font-mono"
            >
              <div className="flex items-center justify-between text-slate-300 mb-1.5 font-sans">
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="w-5 h-5 rounded-md bg-rose-500/20 text-rose-400 flex items-center justify-center text-[10px]">
                    {trace.step || idx + 1}
                  </span>
                  <span className="text-amber-300 flex items-center gap-1">
                    <Wrench className="w-3 h-3 text-amber-400" />
                    {trace.tool_name}()
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">{trace.timestamp}</span>
              </div>

              {trace.arguments && Object.keys(trace.arguments).length > 0 && (
                <div className="mb-1.5 text-slate-400">
                  <span className="text-slate-400">Args: </span>
                  <span className="text-slate-300">{JSON.stringify(trace.arguments)}</span>
                </div>
              )}

              <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/60 overflow-x-auto text-[11px] text-emerald-400">
                <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5 font-sans">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Tool Result:
                </div>
                <pre className="whitespace-pre-wrap break-words">
                  {typeof trace.output === 'object'
                    ? JSON.stringify(trace.output, null, 2)
                    : String(trace.output)}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
