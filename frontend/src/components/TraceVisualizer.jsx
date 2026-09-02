import React, { useState } from 'react';
import { ChevronRight, ChevronDown, CheckCircle2, Wrench, ArrowRightLeft, Sparkles, Terminal, Cpu } from 'lucide-react';

export default function TraceVisualizer({ traces = [], handoffs = [], activeAgent, psychologicalFramework }) {
  const [isOpen, setIsOpen] = useState(true);

  const hasTraces = traces && traces.length > 0;
  const hasHandoffs = handoffs && handoffs.length > 0;

  if (!hasTraces && !hasHandoffs && !psychologicalFramework) return null;

  return (
    <div className="bg-[#0b0c0f] border border-[#22232a] rounded-xl p-3 my-2.5 shadow-inner">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left text-[11px] font-semibold text-zinc-400 hover:text-white transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span className="font-bold text-zinc-200 tracking-tight flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-zinc-400" />
            Swarm Orchestration Trace
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#181920] text-zinc-300 border border-[#262732] font-mono">
            {traces.length} tool{traces.length !== 1 ? 's' : ''} • {handoffs.length} handoff{handoffs.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="p-0.5 rounded bg-[#181920] text-zinc-400">
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </div>
      </button>

      {isOpen && (
        <div className="mt-3 space-y-2.5 pt-2 border-t border-[#1e1f26]">
          {/* Active Agent and Framework Tag */}
          {psychologicalFramework && (
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#14151b] border border-[#242530] text-[11px]">
              <span className="text-zinc-200 flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3 h-3 text-zinc-400" />
                <strong className="text-white">Active Paradigm:</strong> {psychologicalFramework}
              </span>
              {activeAgent && (
                <span className="text-zinc-300 font-semibold px-2 py-0.5 rounded bg-[#1f2028] text-[10px]">
                  {activeAgent}
                </span>
              )}
            </div>
          )}

          {/* Handoff Trace Visualization */}
          {hasHandoffs && (
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 flex items-center gap-1 px-1">
                <ArrowRightLeft className="w-3 h-3 text-zinc-400" /> Swarm Dynamic Handoffs
              </div>
              {handoffs.map((h, hIdx) => (
                <div
                  key={hIdx}
                  className="bg-[#121318] border border-[#22242e] rounded-lg p-2 text-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-[#181920] text-zinc-300 text-[10px] font-mono border border-[#262732]">
                      {h.from_agent}
                    </span>
                    <span className="text-zinc-400 text-xs font-bold">➔</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#1e2028] border border-[#2e303c] text-zinc-200 text-[10px] font-bold">
                      {h.to_agent}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 italic max-w-xs truncate">
                    {h.reason}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Tool Execution Traces */}
          {hasTraces && (
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 flex items-center gap-1 px-1">
                <Terminal className="w-3 h-3 text-zinc-400" /> Function Tool Execution
              </div>
              {traces.map((trace, idx) => (
                <div
                  key={idx}
                  className="bg-[#121318] border border-[#22242e] rounded-xl p-2.5 text-xs font-mono"
                >
                  <div className="flex items-center justify-between text-zinc-300 mb-1.5 font-sans">
                    <div className="flex items-center gap-2 font-medium text-[11px]">
                      <span className="w-4 h-4 rounded bg-[#1c1d24] text-zinc-300 flex items-center justify-center text-[10px] font-mono font-bold">
                        {trace.step || idx + 1}
                      </span>
                      <span className="text-zinc-200 font-mono font-bold flex items-center gap-1">
                        <Wrench className="w-3 h-3 text-zinc-500" />
                        {trace.tool_name}()
                      </span>
                      {trace.agent_name && (
                        <span className="px-1.5 py-0.2 text-[9.5px] rounded bg-[#181920] text-zinc-400 font-sans border border-[#24252e]">
                          via {trace.agent_name}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">{trace.timestamp}</span>
                  </div>

                  {trace.arguments && Object.keys(trace.arguments).length > 0 && (
                    <div className="mb-1.5 text-[10.5px] text-zinc-400 font-mono bg-[#0c0d10] px-2 py-1 rounded-lg border border-[#1e1f26]">
                      <span className="text-zinc-500">params: </span>
                      <span className="text-zinc-300">{JSON.stringify(trace.arguments)}</span>
                    </div>
                  )}

                  <div className="bg-[#0c0d10] p-2 rounded-lg border border-[#1e1f26] overflow-x-auto text-[10.5px] text-zinc-200 font-mono max-h-44">
                    <div className="flex items-center gap-1 text-[9px] text-zinc-500 mb-0.5 font-sans font-semibold uppercase tracking-wider">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Validated Payload:
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
      )}
    </div>
  );
}



