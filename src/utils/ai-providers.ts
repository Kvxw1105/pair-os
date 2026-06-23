export interface AiProvider {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  models: { id: string; name: string; description: string }[];
  defaultModel: string;
  region: 'cn' | 'global';
  freeTier?: string;
}

export const AI_PROVIDERS: AiProvider[] = [
  {
    id: 'siliconflow',
    name: 'SiliconFlow',
    description: '硅基流动 — 国内低延迟，OpenAI 兼容，模型最全',
    baseUrl: 'https://api.siliconflow.cn/v1',
    models: [
      { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3', description: '通用对话' },
      { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1', description: '推理强' },
      { id: 'Qwen/Qwen2.5-7B-Instruct', name: 'Qwen2.5 7B', description: '中文强' },
      { id: 'THUDM/glm-4-9b-chat', name: 'GLM-4 9B', description: '长文本' },
    ],
    defaultModel: 'deepseek-ai/DeepSeek-V3',
    region: 'cn',
    freeTier: '9B以下永久免费',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'DeepSeek 官方 — 推理强，价格低',
    baseUrl: 'https://api.deepseek.com/v1',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat', description: '通用对话' },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1', description: '数学/推理强' },
    ],
    defaultModel: 'deepseek-chat',
    region: 'cn',
    freeTier: '新用户 100万 token',
  },
  {
    id: 'kimi',
    name: 'Kimi',
    description: '月之暗面 — 长文档/RAG 第一梯队',
    baseUrl: 'https://api.moonshot.cn/v1',
    models: [
      { id: 'moonshot-v1-8k', name: 'Kimi 8K', description: '快速响应' },
      { id: 'moonshot-v1-32k', name: 'Kimi 32K', description: '长文本' },
      { id: 'moonshot-v1-128k', name: 'Kimi 128K', description: '超长文档' },
    ],
    defaultModel: 'moonshot-v1-8k',
    region: 'cn',
    freeTier: '新用户 500万 token',
  },
  {
    id: 'aliyun',
    name: '阿里云百炼',
    description: 'DashScope — 模型最全，企业级稳定',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: [
      { id: 'qwen-plus', name: '通义千问 Plus', description: '通用对话' },
      { id: 'qwen-turbo', name: '通义千问 Turbo', description: '快速响应' },
      { id: 'deepseek-v3', name: 'DeepSeek V3', description: '通过百炼调用' },
    ],
    defaultModel: 'qwen-plus',
    region: 'cn',
    freeTier: '每模型 100万 token / 3个月',
  },
  {
    id: 'zhipu',
    name: '智谱 AI',
    description: 'GLM — 永久免费小模型，超长上下文',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    models: [
      { id: 'glm-4', name: 'GLM-4', description: '通用对话' },
      { id: 'glm-4-flash', name: 'GLM-4 Flash', description: '永久免费' },
      { id: 'glm-4v', name: 'GLM-4V', description: '多模态' },
    ],
    defaultModel: 'glm-4',
    region: 'cn',
    freeTier: 'GLM-4-Flash 永久免费',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'OpenAI 官方 — GPT-4 系列',
    baseUrl: 'https://api.openai.com/v1',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', description: '多模态' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: '快速便宜' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: '最强推理' },
    ],
    defaultModel: 'gpt-4o',
    region: 'global',
    freeTier: '新用户 $5 试用',
  },
  {
    id: 'anthropic',
    name: 'Claude',
    description: 'Anthropic — 高质量长文本生成',
    baseUrl: 'https://api.anthropic.com/v1',
    models: [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: '均衡之选' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: '最强推理' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: '快速响应' },
    ],
    defaultModel: 'claude-3-5-sonnet-20241022',
    region: 'global',
  },
  {
    id: 'custom',
    name: '自定义',
    description: '手动输入 Base URL 和 Model',
    baseUrl: '',
    models: [],
    defaultModel: '',
    region: 'global',
  },
];

export function getProviderById(id: string): AiProvider | undefined {
  return AI_PROVIDERS.find((p) => p.id === id);
}

export function detectProvider(baseUrl: string): AiProvider | undefined {
  if (!baseUrl) return undefined;
  const url = baseUrl.toLowerCase().trim();
  return AI_PROVIDERS.find((p) => {
    if (p.id === 'custom') return false;
    return url.includes(p.baseUrl.toLowerCase().replace('/v1', ''));
  });
}
