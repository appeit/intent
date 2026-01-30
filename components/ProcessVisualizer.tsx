
import React from 'react';
import { IntentResult, IntentOutcome, InputType } from '../types';
import { 
  CheckCircle2, 
  HelpCircle, 
  AlertCircle, 
  Target, 
  Wrench, 
  Zap,
  Layers,
  Search,
  Crosshair,
  Activity,
  Info
} from 'lucide-react';

interface ProcessVisualizerProps {
  lastResult?: IntentResult;
  currentStage?: number;
  isProcessing?: boolean;
  compact?: boolean;
  intermediateData?: {
    candidates?: IntentOutcome[];
    inputType?: InputType;
  };
}

const ProcessVisualizer: React.FC<ProcessVisualizerProps> = ({ 
  lastResult, 
  currentStage = 0, 
  isProcessing = false, 
  intermediateData
}) => {
  const isIdle = !lastResult && !isProcessing;
  const safeIntermediateData = intermediateData || {};

  if (isIdle) return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-950 text-slate-600">
      <Layers size={48} className="mb-4 opacity-10 animate-pulse" />
      <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">待机中</h3>
    </div>
  );

  const stages = [
    {
      id: 1,
      name: '阶段 1: 意图路由',
      icon: Search,
      desc: '候选策略集与其判定定义',
      content: (res: IntentResult | undefined, active: boolean) => {
        const candidates = (isProcessing && currentStage >= 1) ? safeIntermediateData.candidates : res?.candidates;
        if (!candidates) return active ? <div className="text-[9px] text-indigo-400 font-mono animate-pulse uppercase">路由中...</div> : null;
        return (
          <div className="flex flex-wrap gap-1 mt-2">
            {candidates.map(c => (
              <div key={c} className="group relative">
                <span className="text-[8px] px-1.5 py-0.5 rounded border border-slate-800 bg-slate-900 text-slate-500 font-mono cursor-help hover:text-indigo-400 hover:border-indigo-500/30 transition-all">
                  {c}
                </span>
              </div>
            ))}
            <div className="w-full mt-1.5 flex items-center gap-1 opacity-50">
               <Info size={8} className="text-slate-600" />
               <span className="text-[7px] text-slate-600 uppercase font-black">AI 已加载候选定义的语义边界</span>
            </div>
          </div>
        );
      }
    },
    {
      id: 2,
      name: '阶段 2: 需求识别',
      icon: Target,
      desc: '基于说明判定意图',
      content: (res: IntentResult | undefined, active: boolean) => {
        if (active) return <div className="mt-2 text-[10px] text-indigo-400 font-mono animate-pulse uppercase">分类识别中...</div>;
        if (!res) return null;
        return (
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-indigo-400 uppercase">{res.intent}</span>
              <span className="text-[8px] text-slate-600 font-mono">置信度: {(res.confidence * 100).toFixed(0)}%</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight italic border-l border-indigo-500/30 pl-2 break-words">"{res.reasoning}"</p>
          </div>
        );
      }
    },
    {
      id: 2.5,
      name: '阶段 2.5: 目标指代',
      icon: Crosshair,
      desc: '锁定操作对象',
      content: (res: IntentResult | undefined, active: boolean) => {
        if (active) return <div className="mt-2 text-[10px] text-indigo-400 font-mono animate-pulse uppercase">目标锁定中...</div>;
        if (!res) return null;
        const isClarify = res.status === 'CLARIFY';
        return (
          <div className={`mt-2 p-2.5 rounded-xl border transition-all ${isClarify ? 'bg-amber-950/20 border-amber-500/30' : 'bg-slate-900 border-slate-800 shadow-inner'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isClarify ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-100">{res.target.type === 'BASE_IMAGE' ? '基础底图' : res.target.type === 'WORKING_IMAGE' ? '生成过程图' : res.target.type}</span>
              </div>
            </div>
            <p className="text-[10px] leading-relaxed mt-2 italic text-slate-400 break-words">{res.target.reasoning}</p>
          </div>
        );
      }
    },
    {
      id: 3,
      name: '阶段 3: 工具路由',
      icon: Wrench,
      desc: '细分执行逻辑分发',
      content: (res: IntentResult | undefined, active: boolean) => {
        if (active) return <div className="mt-2 text-[10px] text-indigo-400 font-mono animate-pulse uppercase">路由分发中...</div>;
        if (!res) return null;
        return (
          <div className="mt-2 space-y-2">
            <div className="bg-indigo-950/30 text-indigo-400 p-2 rounded border border-indigo-500/20 text-[10px] font-mono shadow-lg flex items-center justify-between">
              <span className="opacity-50 text-[8px] uppercase">MCP 调用:</span>
              <span className="font-black">{res.tool.mcpName}</span>
            </div>
            {Object.keys(res.tool.slots).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(res.tool.slots).filter(([_, v]) => v).map(([k, v]) => (
                  <span key={k} className="bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[8px] font-mono lowercase">
                    {k}:{String(v)}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      }
    },
    {
      id: 4,
      name: '阶段 4: 最终决策',
      icon: Zap,
      desc: '流程出口判定',
      content: (res: IntentResult | undefined, active: boolean) => {
        if (active) return <div className="mt-2 text-[10px] text-indigo-400 font-mono animate-pulse uppercase">决策中...</div>;
        if (!res) return null;
        const statusConfig = {
          EXECUTE: { label: '执行', color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-950/20', icon: CheckCircle2 },
          CLARIFY: { label: '待补全', color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-950/20', icon: HelpCircle },
          FALLBACK: { label: '回退', color: 'text-red-400', border: 'border-red-500/30', bg: 'bg-red-950/20', icon: AlertCircle }
        };
        const config = (statusConfig as any)[res.status];
        const Icon = config.icon;
        return (
          <div className="mt-2 space-y-3">
            <div className={`p-2.5 rounded-xl border flex items-center justify-between ${config.border} ${config.bg} ${config.color}`}>
              <div className="flex items-center space-x-2">
                <Icon size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">{config.label}</span>
              </div>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 shadow-xl">
               <p className="text-[11px] leading-relaxed italic text-slate-300">"{res.responseMessage}"</p>
            </div>
          </div>
        );
      }
    }
  ];

  return (
    <div className="h-full flex flex-col bg-slate-950 p-6 overflow-y-auto custom-scrollbar">
      <div className="mb-8 flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2">
          <Activity size={14} className="text-indigo-400" />
          <h2 className="font-black uppercase tracking-tighter text-slate-100 text-sm">全链路链路追踪</h2>
        </div>
      </div>
      <div className="relative border-l border-slate-800 ml-3 pl-8 space-y-12">
        {stages.map((stage) => {
          const isDone = isProcessing ? currentStage > stage.id : !!lastResult;
          const isActive = isProcessing && currentStage === stage.id;
          return (
            <div key={stage.id} className={`relative transition-all duration-500 ${isProcessing && currentStage < (stage.id === 2.5 ? 2.1 : stage.id) ? 'opacity-30' : 'opacity-100'}`}>
              <div className={`absolute -left-[41px] top-0 w-5 h-5 rounded-full border-2 bg-slate-950 flex items-center justify-center transition-all ${isDone ? 'border-indigo-500' : isActive ? 'border-indigo-400 animate-pulse bg-indigo-950/30' : 'border-slate-800'}`}>
                {isDone && <CheckCircle2 size={10} className="text-indigo-500" />}
              </div>
              <div className="flex items-center space-x-2 mb-1">
                <stage.icon size={16} className={isActive ? 'text-indigo-400' : 'text-slate-500'} />
                <span className={`text-[11px] font-black uppercase ${isActive ? 'text-indigo-400' : 'text-slate-100'}`}>{stage.name}</span>
              </div>
              <p className="text-[9px] text-slate-600 font-mono mb-2">{stage.desc}</p>
              {stage.content(lastResult, isActive)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProcessVisualizer;