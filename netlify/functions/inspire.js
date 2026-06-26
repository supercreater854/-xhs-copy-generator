// Netlify Function: 灵感墙动态生成
// 每次请求用 DeepSeek 生成全新卡片，告别硬编码

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

const SYSTEM_PROMPT = `你是社交媒体爆款内容灵感生成器。每次生成指定数量的精选卡片。

规则：
- 随机选择不同产品类别（美妆、数码、美食、穿搭、护肤、咖啡、家居、运动等）
- 随机分配到平台（小红书、朋友圈、微博、抖音各占约25%）
- 小红书风格热情真诚带emoji，朋友圈风格生活化，微博风格热点话题+带#标签，抖音风格短促冲击力
- 每条都有吸引人的标题、简短的预览、完整的正文内容

返回纯JSON：
{
  "cards": [
    {
      "product": "产品名",
      "platform": "xiaohongshu|pengyouquan|weibo|douyin",
      "title": "带emoji的吸引人标题",
      "preview": "25-35字简短预览，制造悬念",
      "content": "完整文案，80-150字，有分段有emoji",
      "tags": ["标签1", "标签2", "标签3", "标签4"]
    }
  ]
}`;

const PRODUCT_POOL = [
  '兰蔻粉底液','YSL口红','珀莱雅精华','MAC口红','玻尿酸面膜',
  '国货眉笔','小米手环','机械键盘','防晒霜','懒人早餐机',
  '星巴克新品','瑜伽垫','无线耳机','护发精油','素颜霜',
  '运动鞋','香薰蜡烛','保温杯','托特包','桌面吸尘器'
];

function extractJSON(text) {
  try { return JSON.parse(text); } catch (_) {}
  const md = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (md) { try { return JSON.parse(md[1].trim()); } catch (_) {} }
  const start = text.indexOf('{'), end = text.lastIndexOf('}');
  if (start !== -1 && end > start) { try { return JSON.parse(text.slice(start, end + 1)); } catch (_) {} }
  return null;
}

// 根据产品名匹配封面 emoji + 渐变
const COVER_MAP = [
  { keys:['粉底','口红','精华','面膜','眉笔','防晒','护肤','美妆','试色','底妆','精油','素颜'], emoji:'💄', gradient:'linear-gradient(135deg, #FFE0E8, #FFD0DB)' },
  { keys:['咖啡','早餐','美食','探店','星巴克'], emoji:'☕', gradient:'linear-gradient(135deg, #FFF0E0, #FFE8D0)' },
  { keys:['键盘','数码','手环','手机','科技','耳机','吸尘器'], emoji:'⌨️', gradient:'linear-gradient(135deg, #E8E8F0, #D8D8E8)' },
  { keys:['穿搭','衣服','鞋','包','运动','瑜伽','托特'], emoji:'👗', gradient:'linear-gradient(135deg, #FFF0F5, #FFE0EC)' },
  { keys:['蜡烛','保温杯','家居'], emoji:'🕯️', gradient:'linear-gradient(135deg, #FFF8F0, #FFE8D8)' },
];
function getCover(product) {
  for (const c of COVER_MAP) { if (c.keys.some(k => product.includes(k))) return c; }
  return { emoji:'✨', gradient:'linear-gradient(135deg, #FFF5F7, #FFEBEF)' };
}

const PLATFORM_MAP = {
  xiaohongshu:  { name:'小红书', icon:'📕', color:'#FF3B5C', bg:'linear-gradient(135deg, #FFF5F7, #FFEBEF)' },
  pengyouquan:  { name:'朋友圈', icon:'💬', color:'#34C759', bg:'linear-gradient(135deg, #F0FFF4, #E0FFE8)' },
  weibo:        { name:'微博',   icon:'🔥', color:'#FF8200', bg:'linear-gradient(135deg, #FFF8F2, #FFF0E5)' },
  douyin:       { name:'抖音',   icon:'🎵', color:'#1D1D1F', bg:'linear-gradient(135deg, #F8F8FA, #EFEFF2)' },
};

function enrichCard(c, idx) {
  const plat = PLATFORM_MAP[c.platform] || PLATFORM_MAP.xiaohongshu;
  const cover = getCover(c.product || '');
  return {
    id: Date.now() + idx,
    platform: c.platform || 'xiaohongshu',
    product: c.product || '好物推荐',
    title: c.title || '',
    preview: c.preview || '',
    content: c.content || '',
    tags: c.tags || [],
    platformName: plat.name,
    platformIcon: plat.icon,
    platformColor: plat.color,
    platformBg: plat.bg,
    coverEmoji: cover.emoji,
    coverGradient: cover.gradient,
    source: 'ai',
  };
}

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const count = Math.min(Math.max(parseInt(event.queryStringParameters?.count) || 12, 4), 20);

  // 随机选取产品注入 prompt，增加多样性
  const shuffled = [...PRODUCT_POOL].sort(() => Math.random() - 0.5);
  const products = shuffled.slice(0, Math.min(count, PRODUCT_POOL.length));

  const userPrompt = `生成 ${count} 条社交媒体内容灵感卡片。\n\n参考产品方向（可自由发挥）：${products.join('、')}\n\n确保平台分布均匀，内容多样化，每条都要独特不重复。`;

  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: '服务端未配置 DEEPSEEK_API_KEY' }) };
    }

    const aiRes = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.95,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error('DeepSeek error:', aiRes.status, errText.slice(0, 300));
      return { statusCode: 502, headers, body: JSON.stringify({ success: false, error: `AI 服务异常 (${aiRes.status})` }) };
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) {
      return { statusCode: 502, headers, body: JSON.stringify({ success: false, error: 'AI 返回为空' }) };
    }

    const parsed = extractJSON(content);
    if (!parsed || !Array.isArray(parsed.cards) || parsed.cards.length === 0) {
      console.error('Parse failed, raw:', content.slice(0, 500));
      return { statusCode: 502, headers, body: JSON.stringify({ success: false, error: 'AI 返回格式异常' }) };
    }

    const cards = parsed.cards.map(enrichCard);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, cards, generatedAt: new Date().toISOString() }),
    };

  } catch (err) {
    console.error('Inspire error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: err.message || '内部错误' }) };
  }
};