
export enum InputType {
  REFERENCE_IMAGE = 'REFERENCE_IMAGE', // 上传参考图
  MODEL_CLOTHING_IMAGE = 'MODEL_CLOTHING_IMAGE', // 选择模特/选择服装
  PURE_TEXT = 'PURE_TEXT',
}

export enum IntentOutcome {
  COPYWRITING = 'COPYWRITING', // 营销文案
  IMAGE_EXPAND = 'IMAGE_EXPAND', // 扩图
  IMAGE_EDIT = 'IMAGE_EDIT', // 图片修改
  T2I = 'T2I', // 文生图
  CLARIFICATION = 'CLARIFICATION',
  IRRELEVANT = 'IRRELEVANT'
}

export enum ImageTarget {
  BASE = 'BASE_IMAGE',
  WORKING = 'WORKING_IMAGE',
  RESULT_INDEX = 'RESULT_INDEX',
  NONE = 'NONE'
}

export interface MultiStagePrompt {
  requirement: string;
  targeting: string;
  execution: string;
  intentLogic: Record<string, string>; // 动态意图逻辑块 (MCP 执行逻辑)
  intentDescriptions: Record<string, string>; // 意图定义的说明文字 (供分类器参考)
}

export interface PromptVersion {
  id: string;
  version: number;
  prompts: MultiStagePrompt;
  timestamp: number;
  description: string;
}

export interface IntentResult {
  candidates: IntentOutcome[];
  inputType: InputType;
  intent: IntentOutcome;
  confidence: number;
  reasoning: string;
  target: {
    type: ImageTarget;
    index?: number;
    reasoning: string;
  };
  tool: {
    mcpName: string;
    category: string;
    slots: Record<string, any>;
    missingSlots: string[];
  };
  status: 'EXECUTE' | 'CLARIFY' | 'FALLBACK';
  responseMessage: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  referenceImages?: string[]; 
  modelImages?: string[];
  clothingImages?: string[];
  workingImages?: string[]; 
  intentResult?: IntentResult;
  timestamp: number;
}
