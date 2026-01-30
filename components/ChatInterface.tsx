
import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, X, MessageSquareText, User, Shirt, Library, 
  Sparkles, PenTool, FileText, Maximize, HelpCircle, AlertCircle, CheckCircle2,
  Tag, Wand2, ArrowRight
} from 'lucide-react';
import { Message, IntentOutcome } from '../types';

interface ChatInterfaceProps {
  messages: Message[];
  onSend: (text: string, images: { reference: string[], model: string[], clothing: string[] }) => void;
  isProcessing: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSend, isProcessing }) => {
  const [input, setInput] = useState('');
  
  // Logic: 0 or 1 to ensure "only the latest" selection is active per round
  const [refSelected, setRefSelected] = useState(false);
  const [modelSelected, setModelSelected] = useState(false);
  const [clothSelected, setClothSelected] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !refSelected && !modelSelected && !clothSelected) return;
    
    const images = {
      reference: refSelected ? ['mock_ref_img'] : [],
      model: modelSelected ? ['mock_model_img'] : [],
      clothing: clothSelected ? ['mock_cloth_img'] : []
    };
    
    onSend(input, images);
    setInput('');
    setRefSelected(false);
    setModelSelected(false);
    setClothSelected(false);
  };

  const hasAnyImages = refSelected || modelSelected || clothSelected;

  const getIntentIcon = (outcome: IntentOutcome) => {
    switch (outcome) {
      case IntentOutcome.T2I: return <Sparkles size={14} />;
      case IntentOutcome.IMAGE_EDIT: return <PenTool size={14} />;
      case IntentOutcome.IMAGE_EXPAND: return <Maximize size={14} />;
      case IntentOutcome.COPYWRITING: return <FileText size={14} />;
      case IntentOutcome.CLARIFICATION: return <HelpCircle size={14} />;
      default: return <AlertCircle size={14} />;
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'EXECUTE': return { label: '执行中', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle2 };
      case 'CLARIFY': return { label: '待确认', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: HelpCircle };
      case 'FALLBACK': return { label: '回退', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: AlertCircle };
      default: return { label: '未知', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: AlertCircle };
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-200 font-sans">
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 scrollbar-thin scrollbar-thumb-slate-800">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20">
            <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mb-6 border border-slate-800 shadow-2xl">
              <MessageSquareText size={40} className="text-indigo-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-2">多模态意图识别</h3>
            <p className="max-w-xs text-slate-500 text-sm">
              上传图片并输入指令，测试底图与过程图的自动路由逻辑。
            </p>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-3xl overflow-hidden shadow-2xl transition-all ${
              m.role === 'user' 
                ? 'bg-indigo-600 text-white px-5 py-4 border border-indigo-500 rounded-tr-none' 
                : m.role === 'system' 
                  ? 'bg-red-950/40 text-red-300 border border-red-900 px-5 py-3 rounded-tl-none'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 px-0 py-0 min-w-[320px] rounded-tl-none'
            }`}>
              
              {/* Tool Execution Header (For Assistant) */}
              {m.role === 'assistant' && m.intentResult && (
                <div className={`px-5 py-2.5 border-b flex items-center justify-between ${getStatusConfig(m.intentResult.status).bg} ${getStatusConfig(m.intentResult.status).border}`}>
                  <div className="flex items-center space-x-2.5">
                    <span className={`${getStatusConfig(m.intentResult.status).color} p-1.5 bg-slate-950/50 rounded-lg`}>
                      {getIntentIcon(m.intentResult.intent)}
                    </span>
                    <div className="flex flex-col">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${getStatusConfig(m.intentResult.status).color}`}>
                        {m.intentResult.tool.mcpName}
                      </span>
                      <span className="text-[8px] text-slate-500 font-mono">{m.intentResult.tool.category}</span>
                    </div>
                  </div>
                  <div className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-tighter ${getStatusConfig(m.intentResult.status).border} ${getStatusConfig(m.intentResult.status).color}`}>
                    {getStatusConfig(m.intentResult.status).label}
                  </div>
                </div>
              )}

              <div className={m.role === 'assistant' ? 'px-6 py-5' : ''}>
                {/* Input Image Display */}
                <div className="flex flex-col gap-3 mb-4">
                  {[
                    { list: m.referenceImages, label: '参考图', icon: Library, color: 'text-blue-400', border: 'border-blue-500/30' },
                    { list: m.modelImages, label: '模特', icon: User, color: 'text-emerald-400', border: 'border-emerald-500/30' },
                    { list: m.clothingImages, label: '服装', icon: Shirt, color: 'text-amber-400', border: 'border-amber-500/30' }
                  ].map((cat, i) => cat.list && cat.list.length > 0 && (
                    <div key={i} className="flex flex-wrap gap-2 items-center">
                      <div className={`flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-slate-950/50 border ${cat.border}`}>
                        <cat.icon size={12} className={cat.color} />
                        <span className="text-[9px] font-bold text-slate-300">{cat.label}</span>
                      </div>
                      <div className="bg-slate-950 border border-slate-800 rounded-lg w-10 h-10 flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-inner uppercase">
                        已选择
                      </div>
                    </div>
                  ))}
                </div>

                {/* Main Content */}
                {m.content && <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-200">{m.content}</p>}

                {/* Working Images Display (The Output!) */}
                {m.role === 'assistant' && m.workingImages && m.workingImages.length > 0 && (
                  <div className="mt-5 space-y-3">
                    <div className="flex items-center space-x-2 text-[10px] font-black text-fuchsia-400 uppercase tracking-widest">
                      <Wand2 size={12} />
                      <span>已生成过程图 (WORKING IMAGE)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {m.workingImages.map((img, idx) => (
                        <div key={idx} className="group relative aspect-square bg-slate-950 rounded-2xl border-2 border-fuchsia-500/30 overflow-hidden shadow-2xl shadow-fuchsia-500/10 hover:border-fuchsia-500 transition-all cursor-zoom-in">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="text-fuchsia-500/20 group-hover:scale-125 transition-transform duration-700" size={40} />
                          </div>
                          <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-fuchsia-600 text-white text-[8px] font-black rounded uppercase shadow-lg">
                            AI 输出
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Slots display in bubble */}
                {m.role === 'assistant' && m.intentResult && Object.keys(m.intentResult.tool.slots).some(k => m.intentResult?.tool.slots[k]) && (
                  <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap gap-2">
                    {Object.entries(m.intentResult.tool.slots).filter(([_, v]) => v).map(([k, v]) => (
                      <div key={k} className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 space-x-2 shadow-sm">
                        <Tag size={10} className="text-indigo-400" />
                        <span className="text-[9px] text-slate-500 font-mono uppercase font-black">{k}</span>
                        <ArrowRight size={8} className="text-slate-700" />
                        <span className="text-[10px] text-indigo-300 font-bold">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={`px-6 pb-3 text-[9px] font-mono opacity-20 ${m.role === 'user' ? 'text-right pt-2' : 'text-left'}`}>
                {new Date(m.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 border-t border-slate-900 bg-slate-900/40 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => setRefSelected(!refSelected)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-2xl border text-[10px] font-black uppercase transition-all shadow-md ${refSelected ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
            >
              <Library size={14} />
              <span>上传参考图</span>
            </button>
            <button 
              type="button"
              onClick={() => setModelSelected(!modelSelected)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-2xl border text-[10px] font-black uppercase transition-all shadow-md ${modelSelected ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
            >
              <User size={14} />
              <span>选择模特</span>
            </button>
            <button 
              type="button"
              onClick={() => setClothSelected(!clothSelected)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-2xl border text-[10px] font-black uppercase transition-all shadow-md ${clothSelected ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
            >
              <Shirt size={14} />
              <span>选择服装</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex space-x-3">
            <div className="relative flex-1 group">
              <input 
                value={input} onChange={(e) => setInput(e.target.value)}
                placeholder="在此输入指令，如：'参考图风格，帮我换个模特背景'..."
                className="w-full p-4 pr-16 bg-slate-900 border border-slate-800 rounded-2xl focus:bg-slate-800 focus:ring-4 focus:ring-indigo-950/50 outline-none transition-all text-sm text-slate-100 shadow-inner placeholder:text-slate-600 group-hover:border-slate-700"
                disabled={isProcessing}
              />
              <button 
                type="submit" 
                disabled={isProcessing || (!input.trim() && !hasAnyImages)} 
                className="absolute right-2 top-2 bottom-2 px-5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-20 transition-all shadow-lg active:scale-95"
              >
                {isProcessing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;