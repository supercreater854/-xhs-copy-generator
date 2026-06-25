const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

const SYSTEM_PROMPT = `你是小红书爆款文案生成专家。根据用户输入生成小红书风格标题和文案。
标题带emoji、口语化、有吸引力。文案第一人称体验分享，80-150字。
返回纯JSON：{"titles":["标题1","标题2","标题3"],"contents":["文案1","文案2","文案3"]}`;

function extractJSON(text) {
  try { return JSON.parse(text); } catch (_) {}
  const md = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (md) { try { return JSON.parse(md[1].trim()); } catch (_) {} }
  const start = text.indexOf('{'), end = text.lastIndexOf('}');
  if (start !== -1 && end > start) { try { return JSON.parse(text.slice(start, end + 1)); } catch (_) {} }
  throw new Error('AI 返回内容无法解析为 JSON');
}

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  let prompt;
  if (event.httpMethod === 'GET') {
    prompt = event.queryStringParameters?.prompt;
  } else if (event.httpMethod === 'POST') {
    try { const body = JSON.parse(event.body || '{}'); prompt = body?.prompt; } catch (_) {}
  } else {
    return { statusCode: 405, headers, body: JSON.stringify({ success: false, error: '仅支持 GET/POST' }) };
  }

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: '请提供 prompt 参数' }) };
  }

  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: '服务端未配置 DEEPSEEK_API_KEY' }) };
    }

    const aiRes = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt.trim() },
        ],
        temperature: 0.9,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      return { statusCode: 502, headers, body: JSON.stringify({ success: false, error: `DeepSeek API 错误 (${aiRes.status}): ${errText.slice(0, 200)}` }) };
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) {
      return { statusCode: 502, headers, body: JSON.stringify({ success: false, error: 'DeepSeek API 返回内容为空' }) };
    }

    const result = extractJSON(content);
    if (!Array.isArray(result.titles) || !Array.isArray(result.contents)) {
      return { statusCode: 502, headers, body: JSON.stringify({ success: false, error: 'AI 返回格式不正确' }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, titles: result.titles.slice(0, 5), contents: result.contents.slice(0, 3) }),
    };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: err.message || '内部错误' }) };
  }
};