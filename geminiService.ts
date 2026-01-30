
import { GoogleGenAI } from "@google/genai";
import { INTENT_RESPONSE_SCHEMA } from "./constants";
import { IntentResult, IntentOutcome, InputType, MultiStagePrompt, Message } from "./types";

export const performIntentRecognition = async (
  prompts: MultiStagePrompt,
  userInput: string,
  history: Message[],
  candidates: IntentOutcome[],
  inputType: InputType,
  baseImages: { reference?: string[], model?: string[], clothing?: string[] },
  workingImages: string[] = [],
  lastResult?: IntentResult
): Promise<IntentResult> => {
  // 从环境变量获取配置，支持动态修改
  const apiKey = process.env.API_KEY;
  const baseUrl = (process.env as any).BASE_URL;
  const modelName = (process.env as any).MODEL_NAME || 'gemini-3-flash-preview';

  const ai = new GoogleGenAI({ 
    apiKey,
    ...(baseUrl ? { baseUrl } : {})
  });
  
  const baseCount = (baseImages.reference?.length || 0) + (baseImages.model?.length || 0) + (baseImages.clothing?.length || 0);
  const workingCount = workingImages.length;

  // 构建意图定义说明 (用于 Stage 1)
  const intentDefinitions = candidates
    .map(c => `- ${c}: ${prompts.intentDescriptions[c] || '无详细说明'}`)
    .join('\n');

  // 构建意图执行逻辑块 (用于 Stage 3)
  const intentSpecificBlocks = Object.entries(prompts.intentLogic)
    .map(([intent, logic]) => `## Intent: ${intent}\n${logic}`)
    .join('\n\n');

  const instruction = `你是一个高级多模态意图识别与工具路由器。

### 通用流程模块
${prompts.requirement}

### 意图说明定义 (Stage 1 参考)
${intentDefinitions}

${prompts.targeting}

### 意图特定执行模块 (Stage 3 参考)
${intentSpecificBlocks}

### 最终输出决策
${prompts.execution}

[当前环境状态]
- 输入类型: ${inputType}
- 环境底图数: ${baseCount} | 生成图数: ${workingCount}
- 候选意图集: ${candidates.join(', ')}
${lastResult?.status === 'CLARIFY' ? `[状态感知] 上轮处于 CLARIFY，意图为 ${lastResult.intent}，缺失槽位: ${lastResult.tool.missingSlots.join(', ')}` : ''}

[核心规则]
1. 识别意图后，必须查阅对应的 [Intent: ...] 逻辑块来提取槽位 (Slots)。
2. 若当前为补全输入，优先继承上轮意图逻辑。
3. 严格遵守 Candidate 约束，不在候选集内的意图必须 Fallback。`;
  
  const parts: any[] = [];
  history.slice(-3).forEach(msg => {
    const role = msg.role === 'user' ? 'User' : 'Assistant';
    parts.push({ text: `${role}: ${msg.content}` });
  });
  parts.push({ text: `User: ${userInput}` });

  const response = await ai.models.generateContent({
    model: modelName,
    contents: [{ parts }],
    config: {
      systemInstruction: instruction,
      responseMimeType: 'application/json',
      responseSchema: INTENT_RESPONSE_SCHEMA
    }
  });

  try {
    const res = JSON.parse(response.text || '{}');
    return { ...res, candidates, inputType } as IntentResult;
  } catch (error) {
    throw new Error("意图解析引擎异常。");
  }
};
