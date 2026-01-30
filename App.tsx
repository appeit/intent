
import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  MessageSquare, 
  RefreshCcw, 
  Database,
  PanelRightClose,
  PanelRightOpen
} from 'lucide-react';
import { PromptVersion, Message, IntentResult, InputType, IntentOutcome, MultiStagePrompt } from './types';
import { DEFAULT_MODULAR_PROMPTS, LOCAL_STORAGE_KEY } from './constants';
import { performIntentRecognition } from './geminiService';
import PromptManager from './components/PromptManager';
import ChatInterface from './components/ChatInterface';
import ProcessVisualizer from './components/ProcessVisualizer';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'prompt' | 'visualizer'>('chat');
  const [showSidePanel, setShowSidePanel] = useState(true);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [currentPrompts, setCurrentPrompts] = useState<MultiStagePrompt>(DEFAULT_MODULAR_PROMPTS);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [intermediateData, setIntermediateData] = useState<{ candidates?: IntentOutcome[], inputType?: InputType }>({});
  
  // Base images context
  const [baseImages, setBaseImages] = useState<{ reference: string[], model: string[], clothing: string[] }>({
    reference: [],
    model: [],
    clothing: []
  });
  
  // Latest working images
  const [workingImages, setWorkingImages] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setVersions(parsed);
      if (parsed.length > 0) {
        // 默认激活最新版本
        setCurrentPrompts(parsed[0].prompts);
        setActiveVersionId(parsed[0].id);
      }
    } else {
      const initialId = crypto.randomUUID();
      const initial: PromptVersion = {
        id: initialId,
        version: 1,
        prompts: DEFAULT_MODULAR_PROMPTS,
        timestamp: Date.now(),
        description: 'V1.0: 初始系统配置'
      };
      setVersions([initial]);
      setCurrentPrompts(DEFAULT_MODULAR_PROMPTS);
      setActiveVersionId(initialId);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([initial]));
    }
  }, []);

  const handleSavePrompts = (prompts: MultiStagePrompt, description: string) => {
    const nextId = crypto.randomUUID();
    const nextVersion: PromptVersion = {
      id: nextId,
      version: (versions[0]?.version || 0) + 1,
      prompts,
      timestamp: Date.now(),
      description: description || `发布新版本 V${(versions[0]?.version || 0) + 1}`
    };
    const newList = [nextVersion, ...versions];
    setVersions(newList);
    setCurrentPrompts(prompts);
    setActiveVersionId(nextId);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newList));
  };

  const handleSwitchVersion = (version: PromptVersion) => {
    setCurrentPrompts(version.prompts);
    setActiveVersionId(version.id);
  };

  const routeStage1 = (images: { reference: string[], model: string[], clothing: string[] }): { type: InputType, candidates: IntentOutcome[] } => {
    if (images.reference.length > 0) {
      return {
        type: InputType.REFERENCE_IMAGE,
        candidates: [IntentOutcome.T2I, IntentOutcome.COPYWRITING, IntentOutcome.IMAGE_EXPAND, IntentOutcome.IMAGE_EDIT, IntentOutcome.CLARIFICATION, IntentOutcome.IRRELEVANT]
      };
    }
    if (images.model.length > 0 || images.clothing.length > 0) {
      return {
        type: InputType.MODEL_CLOTHING_IMAGE,
        candidates: [IntentOutcome.T2I, IntentOutcome.IMAGE_EDIT, IntentOutcome.CLARIFICATION, IntentOutcome.IRRELEVANT]
      };
    }
    return {
      type: InputType.PURE_TEXT,
      candidates: [IntentOutcome.T2I, IntentOutcome.COPYWRITING, IntentOutcome.CLARIFICATION, IntentOutcome.IRRELEVANT]
    };
  };

  const handleSendMessage = async (text: string, newImages: { reference: string[], model: string[], clothing: string[] }) => {
    const updatedBase = {
      reference: newImages.reference.length > 0 ? newImages.reference : baseImages.reference,
      model: newImages.model.length > 0 ? newImages.model : baseImages.model,
      clothing: newImages.clothing.length > 0 ? newImages.clothing : baseImages.clothing,
    };
    setBaseImages(updatedBase);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      referenceImages: newImages.reference,
      modelImages: newImages.model,
      clothingImages: newImages.clothing,
      timestamp: Date.now()
    };

    const lastResult = messages.filter(m => m.intentResult).pop()?.intentResult;
    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);
    setCurrentStage(1);

    try {
      const { type, candidates } = routeStage1(updatedBase);
      setIntermediateData({ inputType: type, candidates }); 
      
      await new Promise(r => setTimeout(r, 600));
      setCurrentStage(2);

      const result = await performIntentRecognition(
        currentPrompts, 
        text, 
        messages.slice(-5).concat(userMessage), 
        candidates, 
        type, 
        updatedBase,
        workingImages,
        lastResult 
      );
      
      setCurrentStage(3);
      await new Promise(r => setTimeout(r, 600));
      setCurrentStage(4);

      let nextWorkingImages = [...workingImages];
      if (result.status === 'EXECUTE' && 
          [IntentOutcome.IMAGE_EDIT, IntentOutcome.IMAGE_EXPAND, IntentOutcome.T2I].includes(result.intent)) {
        const newWorkImg = `working_${Date.now()}`;
        nextWorkingImages = [newWorkImg]; 
        setWorkingImages(nextWorkingImages);
      }

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.responseMessage,
        intentResult: result,
        workingImages: nextWorkingImages,
        timestamp: Date.now()
      }]);
    } catch (error) {
      setCurrentStage(0);
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'system', content: `错误: ${error instanceof Error ? error.message : '未知错误'}`, timestamp: Date.now() }]);
    } finally {
      setIsProcessing(false);
      setIntermediateData({});
    }
  };

  const lastIntentResult = messages.filter(m => m.intentResult).pop()?.intentResult;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      <nav className="w-20 bg-slate-900 flex flex-col items-center py-10 space-y-10 border-r border-slate-800 z-20">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-2xl shadow-indigo-500/20">
          <Database size={24} />
        </div>
        <button title="对话" onClick={() => setActiveTab('chat')} className={`p-3 rounded-2xl transition-all ${activeTab === 'chat' ? 'bg-slate-800 text-indigo-400 border border-slate-700 shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}><MessageSquare size={24} /></button>
        <button title="提示词管理" onClick={() => setActiveTab('prompt')} className={`p-3 rounded-2xl transition-all ${activeTab === 'prompt' ? 'bg-slate-800 text-indigo-400 border border-slate-700 shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}><Settings size={24} /></button>
        <div className="flex-1" />
        <button title="重置对话" onClick={() => { setMessages([]); setWorkingImages([]); setBaseImages({ reference: [], model: [], clothing: [] }); }} className="p-3 text-slate-600 hover:text-red-400 transition-colors"><RefreshCcw size={20} /></button>
      </nav>
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950">
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8 z-10">
          <div className="flex items-center space-x-4">
            <h1 className="text-sm font-black tracking-widest uppercase text-slate-200">意图路由引擎 V5.5</h1>
            <span className="bg-slate-800 text-indigo-400 px-2 py-0.5 rounded border border-slate-700 text-[9px] font-mono font-bold tracking-tighter uppercase">MCP_模块化</span>
          </div>
          <div className="flex items-center space-x-4">
            {isProcessing && <div className="text-[10px] text-indigo-400 animate-pulse font-mono uppercase tracking-tighter">处理中...</div>}
            <button title={showSidePanel ? "隐藏面板" : "显示面板"} onClick={() => setShowSidePanel(!showSidePanel)} className={`p-2 rounded-lg transition-all ${showSidePanel ? 'text-indigo-400 bg-slate-800' : 'text-slate-500 hover:bg-slate-800'}`}>
              {showSidePanel ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-hidden flex">
          {activeTab === 'chat' && (
            <>
              <div className="flex-1 overflow-hidden"><ChatInterface messages={messages} onSend={handleSendMessage} isProcessing={isProcessing} /></div>
              {showSidePanel && (
                <div className="w-80 lg:w-96 border-l border-slate-800 bg-slate-900 overflow-hidden shadow-2xl">
                  <ProcessVisualizer lastResult={lastIntentResult} currentStage={currentStage} isProcessing={isProcessing} intermediateData={intermediateData} compact={true} />
                </div>
              )}
            </>
          )}
          {activeTab === 'prompt' && (
            <PromptManager 
              versions={versions} 
              currentPrompts={currentPrompts} 
              activeVersionId={activeVersionId}
              onSave={handleSavePrompts} 
              onSwitch={handleSwitchVersion} 
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
