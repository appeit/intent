
import React, { useState, useEffect } from 'react';
import { 
  Save, History, Target, Crosshair, Zap, 
  ChevronRight, Box, Cpu, FileJson,
  Sparkles, PenTool, FileText, Maximize,
  Info, ArrowRight, Layout, CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PromptVersion, MultiStagePrompt, IntentOutcome } from '../types';

interface PromptManagerProps {
  versions: PromptVersion[];
  currentPrompts: MultiStagePrompt;
  activeVersionId: string | null;
  onSave: (prompts: MultiStagePrompt, description: string) => void;
  onSwitch: (version: PromptVersion) => void;
}

const PromptManager: React.FC<PromptManagerProps> = ({ versions, currentPrompts, activeVersionId, onSave, onSwitch }) => {
  const [activeStage, setActiveStage] = useState<'requirement' | 'targeting' | 'execution' | 'intentLogic'>('intentLogic');
  const [activeIntent, setActiveIntent] = useState<string>(IntentOutcome.T2I);
  const [tempPrompts, setTempPrompts] = useState<MultiStagePrompt>(currentPrompts);
  const [description, setDescription] = useState('');

  // 当外部 currentPrompts 改变（如切换版本）时，同步编辑器的临时状态
  useEffect(() => {
    setTempPrompts(currentPrompts);
  }, [currentPrompts]);

  const stages = [
    { id: 'requirement', name: 'S1: 需求分类', icon: Target },
    { id: 'targeting', name: 'S2: 目标锁定', icon: Crosshair },
    { id: 'intentLogic', name: 'S3: 意图详情 (MCP)', icon: Box },
    { id: 'execution', name: 'S4: 决策出口', icon: Zap },
  ];

  const intentIcons: Record<string, any> = {
    [IntentOutcome.T2I]: Sparkles,
    [IntentOutcome.IMAGE_EDIT]: PenTool,
    [IntentOutcome.COPYWRITING]: FileText,
    [IntentOutcome.IMAGE_EXPAND]: Maximize,
    [IntentOutcome.CLARIFICATION]: Info,
    [IntentOutcome.IRRELEVANT]: Info,
  };

  const handleTextChange = (val: string, type: 'logic' | 'desc' | 'stage') => {
    if (type === 'logic') {
      setTempPrompts(prev => ({
        ...prev,
        intentLogic: { ...prev.intentLogic, [activeIntent]: val }
      }));
    } else if (type === 'desc') {
      setTempPrompts(prev => ({
        ...prev,
        intentDescriptions: { ...prev.intentDescriptions, [activeIntent]: val }
      }));
    } else {
      setTempPrompts(prev => ({ ...prev, [activeStage]: val }));
    }
  };

  const handleIntentClick = (intent: string) => {
    setActiveIntent(intent);
    setActiveStage('intentLogic');
  };

  const handleDeploy = () => {
    onSave(tempPrompts, description || `发布新版本 V${(versions[0]?.version || 0) + 1}`);
    setDescription('');
  };

  const activeVersion = versions.find(v => v.id === activeVersionId);
  const isDirty = JSON.stringify(tempPrompts) !== JSON.stringify(activeVersion?.prompts);

  return (
    <div className="h-full flex flex-col md:flex-row p-6 gap-6 max-w-7xl mx-auto w-full bg-slate-950 overflow-hidden">
      {/* 左侧导航栏 */}
      <div className="w-full md:w-64 flex flex-col space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-shrink-0">
        <div className="space-y-1.5">
          <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-4 mb-3 flex items-center gap-2">
            <Layout size={10} />
            流水线阶段
          </h3>
          {stages.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveStage(s.id as any)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all border ${
                activeStage === s.id 
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center space-x-3">
                <s.icon size={14} />
                <span className="text-[11px] font-bold">{s.name}</span>
              </div>
              {activeStage === s.id && <ChevronRight size={12} className="animate-in slide-in-from-left duration-200" />}
            </button>
          ))}
        </div>

        <div className="px-4">
          <div className="h-px bg-slate-800 w-full" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-[10px] font-black text-indigo-500/50 uppercase tracking-widest px-4 mb-3 flex items-center gap-2">
            <Box size={10} />
            意图模块库
          </h3>
          <div className="grid grid-cols-1 gap-1">
            {Object.keys(intentIcons).map(intent => {
              const Icon = intentIcons[intent];
              const isSelected = activeStage === 'intentLogic' && activeIntent === intent;
              return (
                <button
                  key={intent}
                  onClick={() => handleIntentClick(intent)}
                  className={`w-full flex items-center justify-between px-4 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-tight transition-all ${
                    isSelected
                    ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-400 ring-1 ring-indigo-500/20'
                    : 'bg-slate-950 border-slate-900/50 text-slate-600 hover:bg-slate-900 hover:text-slate-400'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon size={12} className={isSelected ? 'text-indigo-400' : 'text-slate-600'} />
                    <span>{intent}</span>
                  </div>
                  {isSelected && <div className="w-1 h-3 bg-indigo-500 rounded-full" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 中间编辑区 */}
      <div className="flex-1 flex flex-col space-y-4 min-w-0 h-full">
        <div className="bg-slate-900 rounded-2xl border border-slate-800 flex flex-col flex-1 overflow-hidden shadow-2xl relative">
          
          <div className="p-4 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <Cpu size={18} className="text-indigo-400" />
              </div>
              <div className="flex items-center text-[11px] font-black uppercase tracking-tight">
                <span className="text-slate-500">流水线</span>
                <ChevronRight size={12} className="mx-2 text-slate-700" />
                <span className="text-indigo-400">
                  {stages.find(s => s.id === activeStage)?.name}
                </span>
                {activeStage === 'intentLogic' && (
                  <>
                    <ChevronRight size={12} className="mx-2 text-slate-700" />
                    <span className="text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700 lowercase">
                      {activeIntent}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
               {isDirty && (
                 <div className="flex items-center space-x-1.5 text-amber-500 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 animate-pulse">
                    <AlertCircle size={10} />
                    <span className="text-[9px] font-black uppercase tracking-widest">检测到内容修改</span>
                 </div>
               )}
               <FileJson size={14} className="text-slate-700" />
            </div>
          </div>
          
          <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-slate-950/20">
            {activeStage === 'intentLogic' ? (
              <div className="flex-1 flex flex-col divide-y divide-slate-800/50">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-6 rounded bg-amber-500/10 flex items-center justify-center text-amber-500">
                      <Info size={14} />
                    </div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      判定边界定义 (分类器语义引导)
                    </label>
                  </div>
                  <textarea 
                    value={tempPrompts.intentDescriptions[activeIntent] || ''}
                    onChange={(e) => handleTextChange(e.target.value, 'desc')}
                    className="w-full h-24 p-4 bg-slate-900 border border-slate-800/50 rounded-xl text-slate-300 font-sans text-xs outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/10 transition-all resize-none shadow-inner"
                    placeholder="描述何时触发此模块..."
                  />
                </div>

                <div className="flex-1 p-6 flex flex-col min-h-[350px]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-6 rounded bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                      <Zap size={14} />
                    </div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      核心逻辑配置 (MCP 工具调度 & 槽位规则)
                    </label>
                  </div>
                  <textarea 
                    value={tempPrompts.intentLogic[activeIntent] || ''}
                    onChange={(e) => handleTextChange(e.target.value, 'logic')}
                    className="flex-1 p-4 bg-slate-900 border border-slate-800/50 rounded-xl text-slate-300 font-mono text-[11px] leading-relaxed outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/10 transition-all resize-none shadow-inner"
                    placeholder="输入该意图的具体执行逻辑..."
                    spellCheck={false}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 p-8">
                 <div className="flex items-center gap-3 mb-4">
                    <div className="w-6 h-6 rounded bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                      <Layout size={14} />
                    </div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      全局流水线逻辑
                    </label>
                  </div>
                <textarea 
                  value={(tempPrompts[activeStage] as string)}
                  onChange={(e) => handleTextChange(e.target.value, 'stage')}
                  className="w-full h-full p-8 bg-slate-900 border border-slate-800 rounded-2xl text-slate-300 font-mono text-xs leading-loose outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/10 transition-all shadow-inner"
                  placeholder={`输入 ${activeStage} 阶段逻辑...`}
                  spellCheck={false}
                />
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center gap-4 flex-shrink-0">
            <div className="flex-1 relative">
              <input 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="填写本次变更的摘要..."
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:border-indigo-500/50 text-[11px] text-slate-300 placeholder:text-slate-700"
              />
            </div>
            <button 
              onClick={handleDeploy}
              className={`px-8 py-3 rounded-xl transition-all shadow-xl font-black text-[10px] uppercase tracking-widest flex items-center space-x-3 active:scale-95 whitespace-nowrap bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20 ring-1 ring-white/10`}
            >
              <Save size={14} />
              <span>发布并激活新版本</span>
            </button>
          </div>
        </div>
      </div>

      {/* 右侧版本历史 */}
      <div className="w-full md:w-64 flex flex-col space-y-4 h-full flex-shrink-0">
        <div className="bg-slate-900 rounded-2xl border border-slate-800 flex flex-col h-full overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-800/50 border-b border-slate-800 flex items-center space-x-2 text-slate-400">
            <History size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">已发布记录</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {versions.map((v) => {
              const isActive = v.id === activeVersionId;
              const isViewing = v.id === versions.find(ver => ver.prompts === currentPrompts)?.id;
              
              return (
                <div 
                  key={v.id} 
                  className={`group p-3 rounded-xl border transition-all cursor-pointer relative ${
                    isActive
                      ? 'border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500/20' 
                      : isViewing 
                        ? 'border-slate-600 bg-slate-800/50'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                  }`}
                  onClick={() => onSwitch(v)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                        V{v.version}
                      </span>
                      {isActive && (
                        <span className="text-[7px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                          <CheckCircle2 size={8} />
                          使用中
                        </span>
                      )}
                    </div>
                    <span className="text-[8px] text-slate-600 font-mono">
                      {new Date(v.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  
                  <p className={`text-[10px] leading-tight mb-2 ${isViewing ? 'text-slate-200' : 'text-slate-500'} group-hover:text-slate-300 transition-colors`}>
                    {v.description}
                  </p>
                  
                  {isViewing && !isActive && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onSwitch(v); }}
                      className="w-full py-1.5 mt-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/30 rounded-lg text-[8px] font-black uppercase transition-all"
                    >
                      切换为此运行版本
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptManager;
