
import { Type } from "@google/genai";
import { MultiStagePrompt, IntentOutcome } from "./types";

export const DEFAULT_MODULAR_PROMPTS: MultiStagePrompt = {
  requirement: `[模块：意图分类器]
1. 分析用户输入与输入类型。
2. 请参考下方的 [意图说明定义] 列表。
3. 在 Candidates 中选择最匹配的一个 Intent。
4. 必须依据其定义边界进行判定，严禁跨界识别。`,

  targeting: `[模块：目标锁定器]
1. 根据用户指令中的“这张”、“这个”或关键词锁定操作对象。
2. 优先级：WORKING_IMAGE > BASE_IMAGE。
3. 如果环境底图有多张，必须返回正确的 index。`,

  execution: `[模块：输出决策]
1. 综合所有槽位填充情况。
2. 若 status 为 CLARIFY，responseMessage 必须包含引导用户补全的询问。
3. 若 status 为 EXECUTE，确认最终调用的 MCP 工具名。`,

  intentDescriptions: {
    [IntentOutcome.T2I]: "纯文本生成图像，或基于参考图生成全新的、非局部修改的图像。适用于'画一个...'、'帮我生成一个...'类需求。",
    [IntentOutcome.IMAGE_EDIT]: "针对已有图像的局部修改、换装、高清化、平铺、去皱等精确编辑操作。适用于'改一下'、'换衣服'、'变清晰'类需求。",
    [IntentOutcome.IMAGE_EXPAND]: "专业的内容延展与特定场景生成。适用于'扩图'、'生成模特套图'、'氛围图'、'服装细节特写'等专业电商出图场景。",
    [IntentOutcome.COPYWRITING]: "基于图像内容或用户指令生成营销文案，包括小红书、朋友圈、INS等平台的带货文案。",
    [IntentOutcome.CLARIFICATION]: "当用户指令过于模糊（如只发一个字）、或者图片与文字完全无法关联时触发，请求用户进一步明确。",
    [IntentOutcome.IRRELEVANT]: "闲聊、问候、或者与图像处理/营销完全无关的指令。"
  },

  intentLogic: {
    [IntentOutcome.T2I]: `[执行逻辑：T2I]
- 核心 MCP: mcp_gen_image_flux
- 关键槽位: prompt, style, ratio。
- 逻辑：分析用户描述的物件、场景、光影，转化为 Flux 专用提示词。`,

    [IntentOutcome.IMAGE_EDIT]: `[执行逻辑：IMAGE_EDIT]
- 备选工具列表：
  - image_edit_tile：纹理/图案平铺
  - image_edit_expand：画布外扩/内容延展
  - image_edit_dewrinkle：去皱/抚平
  - image_edit_inpaint：局部重绘/局部修改（含换背景、改色等）
  - image_edit_fix_hands：手部修复
  - image_edit_upscale：高清/放大/超分
  - image_edit_change_clothes：模特换衣/换装
- 逻辑：根据动作动词（换、洗、扩、修）精准匹配工具。`,

    [IntentOutcome.COPYWRITING]: `[执行逻辑：COPYWRITING]
- 核心 MCP: mcp_copywriter_pro
- 关键槽位: platform, keywords, tone。
- 逻辑：提取图像视觉特征，生成符合平台调性的文案。`,

    [IntentOutcome.IMAGE_EXPAND]: `[执行逻辑：IMAGE_EXPAND]
- 备选工具列表：
  - image_expand_pov：POV 视角
  - image_expand_garment_detail：服装细节
  - image_expand_character_closeup：人物特写
  - image_expand_model_set：模特套图
  - image_expand_dynamic：动态抓拍
  - image_expand_scene：空境
  - image_expand_mood：氛围图
  - image_expand_outfit_compare：穿搭对比
  - image_expand_structure：结构示意图
  - image_expand_color_card：色卡图
  - image_expand_match_matrix：搭配矩阵图
  - image_expand_flat_lay：服装平铺图
- 逻辑：识别用户对电商场景的具体诉求，分发至特定模板。`
  }
};

export const INTENT_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    intent: { type: Type.STRING },
    confidence: { type: Type.NUMBER },
    reasoning: { type: Type.STRING },
    responseMessage: { type: Type.STRING },
    target: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING },
        index: { type: Type.NUMBER },
        reasoning: { type: Type.STRING }
      },
      required: ['type', 'reasoning']
    },
    tool: {
      type: Type.OBJECT,
      properties: {
        mcpName: { type: Type.STRING },
        category: { type: Type.STRING },
        slots: { 
          type: Type.OBJECT,
          properties: {
            prompt: { type: Type.STRING },
            style: { type: Type.STRING },
            platform: { type: Type.STRING },
            instruction: { type: Type.STRING },
            keywords: { type: Type.STRING }
          }
        },
        missingSlots: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ['mcpName', 'category', 'slots', 'missingSlots']
    },
    status: { type: Type.STRING, enum: ['EXECUTE', 'CLARIFY', 'FALLBACK'] }
  },
  required: ['intent', 'confidence', 'reasoning', 'responseMessage', 'target', 'tool', 'status']
};

export const LOCAL_STORAGE_KEY = 'INTENT_PROMPT_HISTORY_V5_5';
