/** Cloudflare Pages Function */
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  let prompt;
  if (request.method === 'GET') {
    prompt = url.searchParams.get('prompt');
  } else if (request.method === 'POST') {
    try { const body = await request.json(); prompt = body.prompt; } catch (_) {}
  }

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return json({ error: '请提供 prompt 参数' }, 400);
  }

  try {
    const result = await callDeepSeek(prompt.trim());
    return json(result, 200);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

const DEEPSEEK_API_HOST = 'api.deepseek.com';
const DEEPSEEK_API_PATH = '/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';
const API_KEY = process.env.DEEPSEEK_API_KEY; // 从环境变量读取

const SYSTEM_PROMPT = `你是小红书爆款文案生成专家。根据用户输入生成小红书风格标题和文案。返回JSON：{"titles":["标题1","标题2","标题3"],"contents":["文案1","文案2","文案3"]}。标题带emoji、口语化。文案80字左右。`;

function extractJSON(text) {
  try { return JSON.parse(text); } catch (_) {}
  const md = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (md) { try { return JSON.parse(md[1].trim()); } catch (_) {} }
  const start = text.indexOf('{'), end = text.lastIndexOf('}');
  if (start !== -1 && end > start) { try { return JSON.parse(text.slice(start, end + 1)); } catch (_) {} }
  throw new Error('无法解析 AI 返回内容');
}

async function callDeepSeek(prompt) {
  const body = JSON.stringify({
    model: DEEPSEEK_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.9,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  });

  const res = await fetch(`https://${DEEPSEEK_API_HOST}${DEEPSEEK_API_PATH}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
    body,
  });

  if (!res.ok) throw new Error(`DeepSeek API 错误 (${res.status})`);

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('DeepSeek API 返回内容为空');

  const result = extractJSON(content);
  if (!Array.isArray(result.titles) || !Array.isArray(result.contents)) {
    throw new Error('AI 返回格式不正确');
  }

  return { titles: result.titles.slice(0, 5), contents: result.contents.slice(0, 3) };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}