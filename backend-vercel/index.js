const express = require('express');

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

const app = express();
app.use(express.json());

app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.options('/api/generate', (_req, res) => res.status(200).end());

app.all('/api/generate', async (req, res) => {
  let prompt;
  if (req.method === 'GET') {
    prompt = req.query?.prompt;
  } else {
    prompt = req.body?.prompt;
  }

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ success: false, error: '请提供 prompt 参数' });
  }

  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, error: '服务端未配置 DEEPSEEK_API_KEY 环境变量' });
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
      return res.status(502).json({ success: false, error: `DeepSeek API 错误 (${aiRes.status}): ${errText.slice(0, 200)}` });
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) {
      return res.status(502).json({ success: false, error: 'DeepSeek API 返回内容为空' });
    }

    const result = extractJSON(content);
    if (!Array.isArray(result.titles) || !Array.isArray(result.contents)) {
      return res.status(502).json({ success: false, error: 'AI 返回格式不正确' });
    }

    return res.status(200).json({
      success: true,
      titles: result.titles.slice(0, 5),
      contents: result.contents.slice(0, 3),
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || '内部错误' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));