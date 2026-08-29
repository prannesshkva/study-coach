import React, { useState } from 'react';
import { ChevronRight, ChevronDown, CheckCircle2, Wrench } from 'lucide-react';

export default function TraceVisualizer({ traces = [] }) {
  const [isOpen, setIsOpen] = useState(true);

  if (!traces || traces.length === 0) return null;

  return (
    <div className="bg-[#0c1017]/90 border border-slate-800 rounded-xl p-3 my-2.5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left text-[11px] font-medium text-slate-400 hover:text-slate-200 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>Plan-Act Trace ({traces.length} step{traces.length > 1 ? 's' : ''})</span>
        </div>
        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>

      {isOpen && (
        <div className="mt-2.5 space-y-2">
          {traces.map((trace, idx) => (
            <div
              key={idx}
              className="bg-[#111622] border border-slate-800/80 rounded-lg p-2.5 text-xs font-mono"
            >
              <div className="flex items-center justify-between text-slate-300 mb-1 font-sans">
                <div className="flex items-center gap-1.5 font-medium text-[11px]">
                  <span className="w-4 h-4 rounded bg-slate-800 text-slate-400 flex items-center justify-center text-[9px]">
                    {trace.step || idx + 1}
                  </span>
                  <span className="text-slate-200 flex items-center gap-1">
                    <Wrench className="w-3 h-3 text-slate-500" />
                    {trace.tool_name}()
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">{trace.timestamp}</span>
              </div>

              {trace.arguments && Object.keys(trace.arguments).length > 0 && (
                <div className="mb-1 text-[11px] text-slate-400 font-mono">
                  <span className="text-slate-500">args: </span>
                  <span className="text-slate-300">{JSON.stringify(trace.arguments)}</span>
                </div>
              )}

              <div className="bg-[#0c1017] p-2 rounded border border-slate-800/80 overflow-x-auto text-[10.5px] text-emerald-400/90 font-mono">
                <div className="flex items-center gap-1 text-[9px] text-slate-500 mb-0.5 font-sans">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500/80" /> result:
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
