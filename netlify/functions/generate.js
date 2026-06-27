const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

/* ================================================================
   Writing Profiles — 精简通用版，先理解内容再写作
   ================================================================ */

const WRITING_PROFILES = {

  smart: {
    name: '智能',
    persona: '你是一位优秀的写作者，能根据内容类型自动选择最佳写法。',
    prompt: '智能模式：先分析用户输入的内容类型（感受/产品/知识/故事/观点等），然后自动选择最合适的写作方式和结构。不套固定模板，让文章自然流畅。'
  },

  natural: {
    name: '自然分享',
    persona: '你是一个真诚的朋友，用日常聊天的口吻写作。',
    prompt: '自然分享模式：像和朋友面对面聊天。用第一人称，口语化表达，真诚不做作。适合分享体验、感受、见闻。'
  },

  viral: {
    name: '爆款吸引',
    persona: '你是一个善于制造传播力的写作者。',
    prompt: '爆款模式：开头要有强钩子抓住注意力，节奏明快，制造好奇和共鸣。让读者忍不住读下去并想转发。不限于产品，任何话题都可以用这种方式引爆。'
  },

  pro: {
    name: '专业深析',
    persona: '你是一个有深度的专业写作者。',
    prompt: '专业模式：逻辑清晰，层层深入。用事实、数据、案例支撑观点。结构完整——引入背景→分析问题→展开方法→总结。适用于任何需要深度分析的题材。'
  },

  story: {
    name: '故事叙述',
    persona: '你是一个会讲故事的人。',
    prompt: '故事模式：用叙事打动读者。有场景细节、有情感起伏、有起承转合。让人身临其境，读完有所感悟。'
  },

  minimal: {
    name: '极简精炼',
    persona: '你是一个追求精准表达的写作者。',
    prompt: '极简模式：只说必要的话，每一句都有分量。克制、精准、大量留白。用最少的字传递最多的信息。'
  },

  emotion: {
    name: '情绪共鸣',
    persona: '你是一个温暖有力量的写作者。',
    prompt: '情绪模式：先共情，再表达。让读者感到"被理解"，然后传递温暖和力量。细腻、有温度、不廉价煽情。'
  },

  convert: {
    name: '说服行动',
    persona: '你是一个有说服力的写作者。',
    prompt: '说服模式：有清晰的论点、严密的逻辑推演、明确的行动号召。让人读完后认同观点并产生行动的冲动。'
  }
};

/* 内容理解 — 写作前必须先分析用户输入 */
const CONTEXT_ANALYSIS = `【第一步：理解你要写的内容】
在动笔之前，先分析用户输入：
1. 这是什么类型的内容？（个人感受/产品分享/知识科普/故事创作/观点表达/问题探讨/其他）
2. 读者会是谁？需要什么样的语气和深度？
3. 这篇文章的核心目的是什么？（记录/分享/说服/教学/共鸣/娱乐）
基于分析结果来创作，不要盲目套模板。`;

/* 长度控制 — 最高优先级，置于风格之前 */
const LENGTH_GUIDES = {
  smart:    '【字数要求】自适应，但至少150个字，保证内容完整有深度。',
  inspire:  '【字数要求 - 最高优先级】正文必须恰好50-100个汉字。这是硬指标，写完后自查字数，不足必须补充。',
  standard: '【字数要求 - 最高优先级】正文必须恰好150-300个汉字。这是硬指标，写完后自查字数，不足必须补充。',
  deep:     '【字数要求 - 最高优先级】正文必须恰好400-700个汉字，至少3段。这是硬指标，写完后自查字数，不足必须补充。',
  long:     '【字数要求 - 最高优先级】正文必须恰好800-1500个汉字，至少5个段落。这是最重要的指令，优先级高于一切。写完之后必须自查字数，如果不足800字，必须继续写直到达标。'
};

/* 按长度决定 variant 数量：短文多版本，长文重质量 */
function variantCount(length) {
  if (length === 'long') return 1;
  if (length === 'deep') return 2;
  return 3;
}

/* 按长度决定 max_tokens */
function maxTokensForLength(length) {
  if (length === 'long') return 10000;
  if (length === 'deep') return 6000;
  return 4000;
}

/* 编辑操作指南 — 替代长度指南，避免与扩写/缩写矛盾 */
const ACTION_GUIDES = {
  polish:  '【操作：润色优化】用户会发送一篇文章给你。请润色优化它，使表达更流畅自然，但保持原有风格和结构不变。不要改变文章的篇幅和信息量。',
  expand:  '【操作：扩写】用户会发送一篇文章给你。请扩写它，增加2-3倍的篇幅。补充更多细节、案例和数据支撑，让内容更丰满充实。保持原有风格。',
  shorten: '【操作：缩写】用户会发送一篇文章给你。请缩写它，压缩到原文的30%-50%，只保留核心信息和观点，去掉冗余。保持原有风格。',
  deai:    '【操作：去AI味】用户会发送一篇文章给你。请重写它，去掉明显的AI痕迹。使用更口语化、更有个性的表达，加入个人感受和真实体验感，让表达更像真人手写。保持原有风格。'
};

/* 通用格式要求 */
function formatGuide(variantN) {
  return `
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
生成${variantN}组不同角度的variants，每组都要完整且独立。
hashtags 要实用、搜索量大，不要编造不存在的标签。
image_prompt 用英文描述画面场景。
comment_copy 要能引发评论区互动。
确保输出是有效JSON，不要在JSON外添加任何文字。
`;
}

/* 构建系统提示 */
function buildSystemPrompt(length, style, action) {
  const profile = WRITING_PROFILES[style] || WRITING_PROFILES.smart;

  // 编辑操作：用 action 指南替代长度指南，避免矛盾指令
  if (action && ACTION_GUIDES[action]) {
    return [
      profile.persona,
      '',
      profile.prompt,
      '',
      ACTION_GUIDES[action],
      '',
      '【输出格式 - 重要】\n返回纯JSON（不要markdown代码块包裹），包含1个variant：\n{\n  "variants": [\n    {\n      "style": "使用的风格名称",\n      "title": "根据操作后内容重新拟定的标题",\n      "content": "处理后的正文",\n      "hashtags": ["标签1","标签2","标签3","标签4","标签5"],\n      "image_prompt": "适合配图的画面描述（英文）",\n      "comment_copy": "适合发在评论区的互动文案"\n    }\n  ]\n}\nhashtags 要实用、搜索量大，不要编造不存在的标签。\n确保输出是有效JSON，不要在JSON外添加任何文字。'
    ].join('\n');
  }

  // 正常创作：CONTEXT_ANALYSIS 在前，字数要求紧跟其后，风格在最后
  const lengthGuide = LENGTH_GUIDES[length] || LENGTH_GUIDES.standard;
  return [
    profile.persona,
    '',
    CONTEXT_ANALYSIS,
    '',
    lengthGuide,
    '',
    profile.prompt,
    '',
    formatGuide(variantCount(length))
  ].join('\n');
}

/* 最低字数阈值 — 用于生成后实际校验 */
const MIN_CHARS = { smart: 100, inspire: 50, standard: 150, deep: 400, long: 800 };

function checkLength(variants, lengthMode) {
  const min = MIN_CHARS[lengthMode] || 100;
  for (const v of variants) {
    const clen = (v.content || '').replace(/[\s\n]/g, '').length;
    if (clen < min) return false;
  }
  return true;
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

  let prompt, length, style, action;
  if (event.httpMethod === 'GET') {
    prompt = event.queryStringParameters?.prompt;
    length = event.queryStringParameters?.length || 'standard';
    style  = event.queryStringParameters?.style  || 'smart';
    action = event.queryStringParameters?.action || '';
  } else if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      prompt = body?.prompt;
      length = body?.length || 'standard';
      style  = body?.style  || 'smart';
      action = body?.action || '';
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

    const systemPrompt = buildSystemPrompt(length, style, action);
    const maxTok = maxTokensForLength(action ? 'standard' : length);
    const minChars = MIN_CHARS[length] || 100;

    let variants = null;
    let userPrompt = prompt.trim();
    const maxAttempts = action ? 1 : 3; // 编辑操作不重试

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      console.log('[generate] 第' + (attempt+1) + '次 style=' + style + ' length=' + length + ' action=' + (action || '-') + ' max_tokens=' + maxTok);

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
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.5,
          max_tokens: maxTok
        }),
        signal: createTimeout(length === 'long' ? 70000 : 45000),
      });

      if (!aiRes.ok) {
        const errText = await aiRes.text().catch(() => '无法读取错误响应');
        console.error('[generate] DeepSeek API 错误', aiRes.status, errText.slice(0, 300));
        if (attempt < maxAttempts - 1) continue;
        return { statusCode: 502, headers: corsHeaders, body: JSON.stringify({ success: false, error: 'AI 服务返回错误 (' + aiRes.status + ')，请稍后重试' }) };
      }

      const aiData = await aiRes.json();
      const content = aiData.choices?.[0]?.message?.content;
      if (!content) {
        console.error('[generate] DeepSeek 返回内容为空');
        if (attempt < maxAttempts - 1) continue;
        return { statusCode: 502, headers: corsHeaders, body: JSON.stringify({ success: false, error: 'AI 返回内容为空，请重试' }) };
      }

      console.log('[generate] 返回长度=' + content.length);

      let result;
      try {
        result = extractJSON(content);
      } catch (e) {
        console.error('[generate] JSON解析失败:', e.message);
        if (attempt < maxAttempts - 1) continue;
        return { statusCode: 502, headers: corsHeaders, body: JSON.stringify({ success: false, error: 'AI 返回格式不正确，请重试' }) };
      }

      if (!Array.isArray(result.variants) || result.variants.length === 0) {
        console.error('[generate] variants 格式不正确');
        if (attempt < maxAttempts - 1) continue;
        return { statusCode: 502, headers: corsHeaders, body: JSON.stringify({ success: false, error: 'AI 返回格式不正确，请重试' }) };
      }

      const actualLens = result.variants.map(v => (v.content || '').replace(/[\s\n]/g, '').length);
      console.log('[generate] 各variant字数: ' + actualLens.join(','));

      // 字数达标或最后一次尝试，接受结果
      if (checkLength(result.variants, length) || attempt >= maxAttempts - 1) {
        variants = result.variants;
        console.log('[generate] 接受结果 attempt=' + (attempt+1));
        break;
      }

      // 字数不够，构造重试 prompt — 直接用中文命令，比系统提示词有效得多
      const min = MIN_CHARS[length] || 150;
      userPrompt = `你上一次回复太短了！正文 content 字段只有${actualLens[0] || 0}个字，远低于${min}字的要求。请重新生成，确保 content 至少${min}个汉字，必须多分段、每段充分展开，不要偷懒。用户原始输入：${prompt.trim()}`;
      console.log('[generate] 字数不足，重试...');
    }

    if (!variants) {
      return { statusCode: 502, headers: corsHeaders, body: JSON.stringify({ success: false, error: '生成失败，请重试' }) };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ success: true, variants: variants.slice(0, 3) }),
    };

  } catch (err) {
    console.error('[generate] 异常', err.message);
    const msg = (err.name === 'AbortError' || err.name === 'TimeoutError')
      ? 'AI 响应超时，请稍后重试'
      : ('生成失败: ' + (err.message || '内部错误'));
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ success: false, error: msg }) };
  }
};