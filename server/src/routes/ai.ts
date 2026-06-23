import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

// AI test connection doesn't require auth - user can test before signing in
router.post('/test', async (req: AuthRequest, res) => {
  try {
    const body = z.object({
      baseUrl: z.string().min(1),
      apiKey: z.string().min(1),
      model: z.string().min(1),
    }).parse(req.body);

    const baseUrl = body.baseUrl.trim().replace(/\/$/, '');
    const apiKey = body.apiKey;
    const model = body.model.trim();

    const url = `${baseUrl}/chat/completions`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      res.status(400).json({
        error: `Connection failed: HTTP ${response.status}`,
        detail: text.slice(0, 200)
      });
      return;
    }

    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    if (data.choices?.[0]?.message?.content) {
      res.json({ success: true, message: '连接成功' });
    } else {
      res.json({ success: true, message: '连接成功（响应格式异常）' });
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    res.status(400).json({ error: `Connection failed: ${(err as Error).message}` });
  }
});

router.use(authMiddleware as any);

// Helper: get AI config from headers (local mode) or database (cloud mode)
async function getAiConfig(req: AuthRequest): Promise<{ enabled: boolean; baseUrl: string; apiKey: string; model: string } | null> {
  const headerKey = req.headers['x-ai-key'] as string | undefined;
  const headerBaseUrl = req.headers['x-ai-baseurl'] as string | undefined;
  const headerModel = req.headers['x-ai-model'] as string | undefined;

  if (headerKey && headerBaseUrl && headerModel) {
    return {
      enabled: true,
      baseUrl: headerBaseUrl.trim().replace(/\/$/, ''),
      apiKey: headerKey,
      model: headerModel.trim(),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { aiConfig: true },
  });

  if (!user?.aiConfig) return null;
  const config = JSON.parse(user.aiConfig);
  if (!config.enabled || !config.apiKey || !config.baseUrl) return null;
  return config;
}

// Get AI config (for cloud mode - local mode returns empty)
router.get('/config', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { aiConfig: true },
    });
    if (!user?.aiConfig) {
      res.json({ enabled: false, baseUrl: '', apiKey: '', model: '' });
      return;
    }
    const config = JSON.parse(user.aiConfig);
    // Don't return full apiKey, only mask
    res.json({
      ...config,
      apiKey: config.apiKey ? '***' + config.apiKey.slice(-4) : '',
    });
  } catch (err) {
    console.error('Get AI config error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update AI config
const configSchema = z.object({
  enabled: z.boolean().default(false),
  baseUrl: z.string().min(1).max(500),
  apiKey: z.string().min(1).max(500),
  model: z.string().min(1).max(100),
});

router.put('/config', async (req: AuthRequest, res) => {
  try {
    const data = configSchema.parse(req.body);
    const existing = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { aiConfig: true },
    });
    
    let apiKey = data.apiKey;
    // If user sends masked key (***), keep existing
    if (apiKey.startsWith('***') && existing?.aiConfig) {
      const existingConfig = JSON.parse(existing.aiConfig);
      apiKey = existingConfig.apiKey;
    }

    const config = JSON.stringify({
      enabled: data.enabled,
      baseUrl: data.baseUrl.trim().replace(/\/$/, ''),
      apiKey,
      model: data.model.trim(),
    });

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { aiConfig: config },
    });

    res.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    console.error('Update AI config error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Suggest when blocked
router.post('/suggest', async (req: AuthRequest, res) => {
  try {
    const { reason, actionTitle, note } = z.object({
      reason: z.string().min(1),
      actionTitle: z.string().min(1),
      note: z.string().optional(),
    }).parse(req.body);

    const config = await getAiConfig(req);
    if (!config) {
      res.status(400).json({ error: 'AI not configured' });
      return;
    }

    // Fetch recent actions for context
    const recentActions = await prisma.action.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        title: true,
        state: true,
        result: true,
        blockedReason: true,
        resultNote: true,
        totalDurationMs: true,
      },
    });

    const context = recentActions.map(a => 
      `- "${a.title}" (${a.state}${a.result ? `, ${a.result}` : ''}${a.blockedReason ? `, blocked: ${a.blockedReason}` : ''})`
    ).join('\n');

    const systemPrompt = `你是一个极简的行动助手。用户正在做一个行动时遇到了阻力。

你的角色：只给一个最具体、可执行的下一步。不要分析、不要鼓励、不给多个选项。

用户的行动历史：
${context}

用户当前行动："${actionTitle}"
卡住原因：${reason}
${note ? `补充说明：${note}` : ''}

规则：
1. 只输出一个具体动作（如"先运行项目，复制第一条报错"）
2. 不要解释为什么
3. 不要给多个选择
4. 如果用户说"不知道下一步"，给一个极小的试探动作
5. 如果用户说"任务太大"，给"只做当前能推进的最小步骤"`;

    const url = `${config.baseUrl}/chat/completions`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: '请给我一个下一步。' },
        ],
        temperature: 0.7,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      res.status(400).json({ error: `AI request failed: ${text.slice(0, 200)}` });
      return;
    }

    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const suggestion = data.choices?.[0]?.message?.content?.trim() || '先尝试运行一下，看看会发生什么。';

    res.json({ suggestion });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    console.error('AI suggest error:', err);
    res.status(500).json({ error: 'AI request failed' });
  }
});

// Refine action title into steps
router.post('/refine', async (req: AuthRequest, res) => {
  try {
    const { title } = z.object({ title: z.string().min(1).max(200) }).parse(req.body);

    const config = await getAiConfig(req);
    if (!config) {
      res.status(400).json({ error: 'AI not configured' });
      return;
    }

    const url = `${config.baseUrl}/chat/completions`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'system',
            content: `你是一个行动细化助手。用户输入了一个模糊的行动描述，你需要把它拆成 2-4 个具体的、可执行的步骤。每个步骤应该在 10-30 分钟内能完成。只输出步骤列表，不要解释。格式：
1. 步骤一
2. 步骤二
3. 步骤三`,
          },
          { role: 'user', content: title },
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      res.status(400).json({ error: `AI request failed: ${text.slice(0, 200)}` });
      return;
    }

    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const refined = data.choices?.[0]?.message?.content?.trim() || '';

    // Parse steps
    const steps = refined
      .split('\n')
      .map((s: string) => s.replace(/^\d+\.\s*/, '').trim())
      .filter((s: string) => s.length > 0);

    res.json({ steps: steps.length > 0 ? steps : [title] });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    console.error('AI refine error:', err);
    res.status(500).json({ error: 'AI request failed' });
  }
});

// Timeline insight - analyze weekly patterns
router.post('/insight', async (req: AuthRequest, res) => {
  try {
    const config = await getAiConfig(req);
    if (!config) {
      res.status(400).json({ error: 'AI not configured' });
      return;
    }

    // Last 7 days of actions
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const actions = await prisma.action.findMany({
      where: {
        userId: req.user!.id,
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { createdAt: 'asc' },
      select: {
        title: true,
        state: true,
        result: true,
        blockedReason: true,
        awayReason: true,
        totalDurationMs: true,
        createdAt: true,
      },
    });

    if (actions.length === 0) {
      res.json({ insight: '还没有足够的行动数据，先开始几个行动吧。' });
      return;
    }

    // Calculate stats
    const total = actions.length;
    const completed = actions.filter(a => a.state === 'completed' || a.result === 'completed').length;
    const partial = actions.filter(a => a.state === 'partial' || a.result === 'partial').length;
    const abandoned = actions.filter(a => a.result === 'abandoned').length;
    const blockedCount = actions.filter(a => a.blockedReason).length;
    const awayCount = actions.filter(a => a.awayReason).length;
    const avgDuration = actions.reduce((s, a) => s + a.totalDurationMs, 0) / total;

    const blockedReasons = actions
      .filter(a => a.blockedReason)
      .map(a => a.blockedReason)
      .reduce((acc, r) => { acc[r!] = (acc[r!] || 0) + 1; return acc; }, {} as Record<string, number>);
    const topBlockedReason = Object.entries(blockedReasons)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || '';

    const awayReasons = actions
      .filter(a => a.awayReason)
      .map(a => a.awayReason)
      .reduce((acc, r) => { acc[r!] = (acc[r!] || 0) + 1; return acc; }, {} as Record<string, number>);
    const topAwayReason = Object.entries(awayReasons)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || '';

    // Hourly distribution
    const hourCounts: Record<number, number> = {};
    actions.forEach(a => {
      const h = new Date(a.createdAt).getHours();
      hourCounts[h] = (hourCounts[h] || 0) + 1;
    });
    const peakHour = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || '';

    const actionList = actions.map(a =>
      `- "${a.title}" (${a.state}, ${Math.round(a.totalDurationMs / 60000)}min${a.blockedReason ? `, blocked:${a.blockedReason}` : ''}${a.awayReason ? `, away:${a.awayReason}` : ''})`
    ).join('\n');

    const systemPrompt = `你是一个极简的行动洞察助手。你分析用户最近一周的行动数据，给出一句具体的、可操作的洞察。

规则：
1. 只输出一句话洞察（30-60字）
2. 不要泛泛而谈，要指出具体模式
3. 如果发现问题，给一个具体的改进建议
4. 如果表现好，给一个保持建议
5. 不要用"建议"这个词开头，直接说

用户数据：
- 总行动数：${total}
- 完成：${completed}，部分完成：${partial}，未完成：${abandoned}
- 平均时长：${Math.round(avgDuration / 60000)} 分钟
- 卡住次数：${blockedCount}${topBlockedReason ? `，主要原因是${topBlockedReason}` : ''}
- 暂离次数：${awayCount}${topAwayReason ? `，主要原因是${topAwayReason}` : ''}
- 最常开始行动的时间段：${peakHour}点

行动列表：
${actionList}`;

    const url = `${config.baseUrl}/chat/completions`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: '用一句话总结我的行动模式。' },
        ],
        temperature: 0.7,
        max_tokens: 120,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      res.status(400).json({ error: `AI request failed: ${text.slice(0, 200)}` });
      return;
    }

    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const insight = data.choices?.[0]?.message?.content?.trim() || '继续行动，数据会告诉你更多。';

    res.json({ insight });
  } catch (err) {
    console.error('AI insight error:', err);
    res.status(500).json({ error: 'AI request failed' });
  }
});

export default router;
