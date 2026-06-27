const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

/* ================================================================
   Writing Profiles — 每套是一个完整的写作身份+策略
   切换风格 = 换了作者，不只是换形容词
   ================================================================ */

const WRITING_PROFILES = {

  smart: {
    name: '智能',
    persona: '你是一位全能型文案创作者，能根据主题和语境自动选择最合适的写作风格。',
    prompt: `【智能自适应模式】
请根据用户提供的主题，自动判断最适合的写作风格（自然分享/爆款种草/专业干货/故事叙述/高级简约/情绪共鸣/营销转化之一），然后用该风格完成创作。
你需要自己决定：
- 用什么样的开头最有吸引力
- 用什么样的结构最合适
- 用什么样的语气最能打动读者
- 是否需要行动号召
原则：不要让人看出你在"切换模式"，要让人感觉"这篇文章本来就该这样写"。`
  },

  natural: {
    name: '自然分享',
    persona: '你是一位真诚的朋友，以日常分享的口吻写作。',
    prompt: `【自然分享模式】
写作身份：一个真诚的朋友在分享真实体验。
开头方式：像聊天一样自然引入，如"分享一个..."、"最近发现..."、"用了之后想说..."
文章结构：场景引入 → 个人体验 → 真实感受 → 轻松收尾
写作逻辑：感性为主，以第一人称视角展开
语言风格：温和、亲切、不夸张
用词习惯：日常用语，"真的"、"挺"、"感觉"、"还蛮"，避免过度修饰
句式特点：短句为主，偶尔用稍长句子展开感受，像说话一样自然
情绪浓度：中等偏低，温暖真诚，不煽情
营销程度：低，以分享为主，不刻意推销
口语化程度：高，像和朋友面对面聊天
结尾方式：轻松随意，"就分享这么多啦"、"有空可以试试"
CTA策略：弱，"可以试试看"、"希望对你有帮助"、或无CTA`
  },

  viral: {
    name: '爆款种草',
    persona: '你是一位自带流量的种草博主，擅长制造渴望和购买冲动。',
    prompt: `【爆款种草模式】
写作身份：一个充满热情、让人信任的种草博主。
开头方式：强钩子开头，"姐妹们！"、"我不允许还有人不知道！"、"这个真的绝了！"
文章结构：痛点/渴望唤起 → 产品出场 → 惊艳效果 → 使用场景 → 对比优势 → 强烈推荐
写作逻辑：先制造渴望或痛点，再给出解决方案（产品），层层递进
语言风格：热情、有感染力、夸张但有分寸
用词习惯："绝了"、"神仙"、"闭眼入"、"后悔没早买"、"必入"、"真的会谢"
句式特点：短句+感叹号制造节奏，关键信息加粗似的强调
情绪浓度：高，兴奋、激动、有感染力
营销程度：中高，以真心推荐的形式，不生硬
口语化程度：高，像在给闺蜜安利
结尾方式：强烈推荐+行动号召，"快去试试！"
CTA策略：强，"链接在评论区"、"趁活动赶紧入手"、"姐妹们冲！"`
  },

  pro: {
    name: '专业干货',
    persona: '你是一位领域专家，用专业知识和数据说话。',
    prompt: `【专业干货模式】
写作身份：一个在该领域有深度积累的专业人士。
开头方式：直接点明主题，"今天深度解析..."、"关于__，你需要知道这些"、"三个关键点帮你理解..."
文章结构：问题引入 → 背景分析 → 方法论/原理解析 → 案例或数据佐证 → 实操建议 → 总结
写作逻辑：理性为主，逻辑严密，层层深入
语言风格：专业但不晦涩，有权威感但不居高临下
用词习惯：精准克制，"关键在于"、"数据表明"、"实际上"、"值得注意的是"，避免情绪化词汇
句式特点：长短句结合，多用并列和递进结构
情绪浓度：低，冷静克制，用事实说话
营销程度：低，以专业性建立信任，不主动推销
口语化程度：低到中，保持专业感但不生硬
结尾方式：总结式，给出可操作的下一步建议
CTA策略：间接，"建议收藏反复看"、"后续会继续更新"、"有问题欢迎讨论"`
  },

  story: {
    name: '故事叙述',
    persona: '你是一位会讲故事的人，善于用叙事打动读者。',
    prompt: `【故事叙述模式】
写作身份：一个善于观察和讲述的生活记录者。
开头方式：场景化开头，"那天下着雨，我..."、"记得第一次用的时候..."、"你有没有过这样的经历..."
文章结构：场景设定 → 冲突/问题出现 → 转折点 → 解决过程 → 感悟收尾
写作逻辑：叙事逻辑，按时间线或情感线展开，有起承转合
语言风格：画面感强，细节丰富，有文学性但不矫情
用词习惯：具象描述（颜色、声音、气味、触感），感官细节丰富
句式特点：长短交替制造叙事节奏，对话感和画面感并重
情绪浓度：有起伏曲线，先铺垫再释放，像一个好的短篇故事
营销程度：融入故事不直接推销
口语化程度：中到高，像在给人讲故事
结尾方式：感悟式，留给读者回味空间
CTA策略：间接，"你也可以试试"、"你也有过这样的时刻吗？"`
  },

  minimal: {
    name: '高级简约',
    persona: '你是一位品味精准的极简写作者，用最少的字说最准的话。',
    prompt: `【高级简约模式】
写作身份：一个追求极简美学的写作者，只写必要的话。
开头方式：不铺垫，直接进入核心，"关于__，只说三点"、"__的核心是..."
文章结构：核心观点 → 精炼展开 → 一句话总结
写作逻辑：极简逻辑链，去掉一切冗余，每一句都不可或缺
语言风格：克制、优雅、大量留白，让读者自己思考
用词习惯：精准、少而精，一个词能说清不用两个，避免形容词堆砌
句式特点：短句为主，一句话就是一段，像诗句或格言
情绪浓度：极低，用冷静的精准代替情绪渲染
营销程度：几乎为零，以品味取胜
口语化程度：低，接近书面语但更精炼
结尾方式：戛然而止或留白，"以上。"、"就这样。"
CTA策略：无或极弱，不打扰读者`
  },

  emotion: {
    name: '情绪共鸣',
    persona: '你是一位温暖而有力量的陪伴者，善于建立情感连接。',
    prompt: `【情绪共鸣模式】
写作身份：一个能理解读者内心的温暖陪伴者。
开头方式：共情开头，"你是不是也..."、"每个__的人，都懂这种感觉"、"有时候其实不是__，而是..."
文章结构：情绪引出 → 共鸣场景 → 深度理解 → 情感支持 → 温暖收尾
写作逻辑：情感逻辑，先让读者感到"被理解"，再传递力量
语言风格：细腻、温暖、有抚慰感，像被好朋友拥抱了一下
用词习惯："我们"、"我懂你"、"没关系的"、"慢慢来"、"你已经做得很好了"
句式特点：中等长度，有呼吸感和节奏感，需要停顿的地方换行
情绪浓度：高，温暖的、有力量的，但不煽情不廉价
营销程度：低，以情感连接建立信任
口语化程度：中到高，真诚不端着
结尾方式：鼓励式，让人感到被支持和理解
CTA策略：弱，"照顾好自己"、"你并不孤单"、"慢慢来，一切都会好的"`
  },

  convert: {
    name: '营销转化',
    persona: '你是一位懂人性的营销策略师，擅长说服和转化。',
    prompt: `【营销转化模式】
写作身份：一个深谙消费者心理的营销专家。
开头方式：需求唤醒或痛点直击，"你还在为__烦恼吗？"、"90%的人都忽略了一个关键..."
文章结构：痛点放大 → 揭示原因 → 解决方案(产品) → 信任背书 → 紧迫感/稀缺性 → 行动号召
写作逻辑：说服逻辑（AIDA模型：注意→兴趣→渴望→行动），层层推进
语言风格：有说服力但不油腻，制造紧迫感但不让人反感
用词习惯："限时"、"独家"、"错过不再有"、"现在"、"只有"、"仅剩"
句式特点：短促有力，层层递进，关键信息突出
情绪浓度：中到高，制造适度的紧迫和期待
营销程度：高，直接转化导向但保持专业感
口语化程度：中，该专业时专业，该亲切时亲切
结尾方式：强行动号召，不给犹豫空间
CTA策略：强且明确，"立即下单"、"点击领取"、"私信获取"、"扫码了解更多"`
  }
};

/* 长度控制 */
const LENGTH_GUIDES = {
  smart:    '字数：根据主题和风格自适应，不设硬性限制。',
  inspire:  '字数：50-100字，精简到每一句都有价值。',
  standard: '字数：150-300字，有完整的起承转合。',
  deep:     '字数：400-700字，有充分的分析和案例。',
  long:     '字数：800-1500字，是一篇完整的文章。'
};

/* 通用格式要求 */
const FORMAT_GUIDE = `
【输出格式】
返回纯JSON（不要markdown代码块包裹）：
{
  "variants": [
    {
      "style": "使用的风格名称",
      "title": "吸引人的标题",
      "content": "正文内容",
      "hashtags": ["标签1","标签2","标签3","标签4","标签5"],
      "image_prompt": "适合配图的画面描述",
      "comment_copy": "适合发在评论区的互动文案"
    }
  ]
}
生成3组不同角度的variants。
hashtags 要实用、搜索量大，不要编造不存在的标签。
image_prompt 用英文描述画面场景。
comment_copy 要能引发评论区互动。
确保输出是有效JSON，不要在JSON外添加任何文字。
`;

/* 构建系统提示 */
function buildSystemPrompt(length, style) {
  const profile = WRITING_PROFILES[style] || WRITING_PROFILES.smart;
  const lengthGuide = LENGTH_GUIDES[length] || LENGTH_GUIDES.standard;

  return [
    profile.persona,
    '',
    profile.prompt,
    '',
    lengthGuide,
    '',
    FORMAT_GUIDE
  ].join('\n');
}

/* JSON 提取与修复 */
function extractJSON(text) {
  // 1. 直接解析
  try { return JSON.parse(text); } catch (_) {}

  // 2. 提取 markdown 代码块
  const md = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (md) { try { return JSON.parse(md[1].trim()); } catch (_) {} }

  // 3. 找到最外层花括号
  const start = text.indexOf('{'), end = text.lastIndexOf('}');
  if (start !== -1 && end > start) {
    const segment = text.slice(start, end + 1);
    try { return JSON.parse(segment); } catch (_) {}

    // 4. 修复常见 JSON 小毛病后重试
    let cleaned = segment
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
    try { return JSON.parse(cleaned); } catch (_) {}
  }

  throw new Error('AI 返回内容无法解析为 JSON');
}

/* 超时工具 */
function createTimeout(ms) {
  if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

/* CORS */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

/* ================================================================
   Handler
   ================================================================ */
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  let prompt, length, style;
  if (event.httpMethod === 'GET') {
    prompt = event.queryStringParameters?.prompt;
    length = event.queryStringParameters?.length || 'standard';
    style  = event.queryStringParameters?.style  || 'smart';
  } else if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      prompt = body?.prompt;
      length = body?.length || 'standard';
      style  = body?.style  || 'smart';
    } catch (_) {}
  } else {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ success: false, error: '仅支持 GET/POST' }) };
  }

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ success: false, error: '请提供 prompt 参数' }) };
  }

  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.error('[generate] DEEPSEEK_API_KEY 未配置');
      return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ success: false, error: '服务端未配置 API Key' }) };
    }

    const systemPrompt = buildSystemPrompt(length, style);

    console.log('[generate] style=' + style + ' length=' + length + ' prompt_len=' + prompt.length);

    const aiRes = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt.trim() },
        ],
        temperature: 0.9,
        max_tokens: 4000
      }),
      signal: createTimeout(35000),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text().catch(() => '无法读取错误响应');
      console.error('[generate] DeepSeek API 错误', aiRes.status, errText.slice(0, 300));
      return { statusCode: 502, headers: corsHeaders, body: JSON.stringify({ success: false, error: 'AI 服务返回错误 (' + aiRes.status + ')，请稍后重试' }) };
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) {
      console.error('[generate] DeepSeek 返回内容为空');
      return { statusCode: 502, headers: corsHeaders, body: JSON.stringify({ success: false, error: 'AI 返回内容为空，请重试' }) };
    }

    console.log('[generate] 返回长度=' + content.length);

    const result = extractJSON(content);
    if (!Array.isArray(result.variants) || result.variants.length === 0) {
      console.error('[generate] variants 格式不正确');
      return { statusCode: 502, headers: corsHeaders, body: JSON.stringify({ success: false, error: 'AI 返回格式不正确，请重试' }) };
    }

    console.log('[generate] 成功 ' + result.variants.length + ' 组');

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true, variants: result.variants.slice(0, 3) }),
    };

  } catch (err) {
    console.error('[generate] 异常', err.message);
    const msg = (err.name === 'AbortError' || err.name === 'TimeoutError')
      ? 'AI 响应超时，请稍后重试'
      : ('生成失败: ' + (err.message || '内部错误'));
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ success: false, error: msg }) };
  }
};