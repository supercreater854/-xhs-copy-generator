/**
 * 微信云函数 — AI 小红书文案生成
 * 调用 DeepSeek API，返回标题 + 文案
 */
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

const SYSTEM_PROMPT = `你是小红书爆款文案专家。根据用户输入生成小红书风格标题和文案。

要求：标题带emoji、口语化、有吸引力。返回JSON：
{"titles":["标题1"],"contents":["文案1(80字左右)"]}`;

function extractJSON(text) {
  try { return JSON.parse(text); } catch (_) {}
  const md = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (md) { try { return JSON.parse(md[1].trim()); } catch (_) {} }
  const start = text.indexOf('{'), end = text.lastIndexOf('}');
  if (start !== -1 && end > start) { try { return JSON.parse(text.slice(start, end + 1)); } catch (_) {} }
  const obj = text.match(/\{[\s\S]*\}/);
  if (obj) { try { return JSON.parse(obj[0]); } catch (_) {} }
  throw new Error('无法解析 AI 返回内容为 JSON');
}

const https = require('https');

const DEEPSEEK_API_HOST = 'api.deepseek.com';
const DEEPSEEK_API_PATH = '/v1/chat/completions';

const FALLBACK_API_KEY = ''; // 请在云函数环境变量中配置 DEEPSEEK_API_KEY

function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch (e) { reject(new Error('解析 DeepSeek 响应失败')); }
      });
    });
    req.on('error', reject);
    req.setTimeout(2800, () => { req.destroy(); reject(new Error('请求超时')); });
    if (body) req.write(body);
    req.end();
  });
}

async function callDeepSeek(prompt) {
  const apiKey = process.env.DEEPSEEK_API_KEY || FALLBACK_API_KEY;
  if (!apiKey) throw new Error('未配置 DeepSeek API Key');

  const body = JSON.stringify({
    model: DEEPSEEK_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.9,
    max_tokens: 300,
  });

  const { status, data } = await httpsRequest(
    {
      hostname: DEEPSEEK_API_HOST,
      path: DEEPSEEK_API_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(body),
      },
    },
    body
  );

  if (status !== 200) {
    throw new Error(`DeepSeek API 错误 (${status}): ${JSON.stringify(data)}`);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('DeepSeek API 返回内容为空');
  return content;
}

exports.main = async (event, context) => {
  // 调试模式：如果没有 prompt 参数，返回完整的 event 内容
  let prompt = event.prompt;
  if (!prompt) {
    // 尝试从 event.body 或其他常见位置获取
    if (typeof event.body === 'string') {
      try { const body = JSON.parse(event.body); prompt = body.prompt; } catch (_) {}
      if (!prompt) prompt = event.body;
    }
  }

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return {
      error: '请提供 prompt 参数',
      code: 'MISSING_PROMPT',
      debug: { eventKeys: Object.keys(event), event },
    };
  }

  const aiText = await callDeepSeek(prompt.trim());
  const result = extractJSON(aiText);

  if (!Array.isArray(result.titles) || !Array.isArray(result.contents)) {
    return { error: 'AI 返回格式不正确', code: 'INVALID_RESPONSE' };
  }

  return {
    titles: result.titles.slice(0, 5),
    contents: result.contents.slice(0, 3),
  };
};