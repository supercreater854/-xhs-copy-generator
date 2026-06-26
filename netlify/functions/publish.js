// Netlify Function: 用户发布到灵感墙
// POST 接收文案，存到模块级变量（热存活期内社区可见）

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

// 模块级存储：同一实例热存活期间持久
let communityCards = [];

const PLATFORM_MAP = {
  xiaohongshu:  { name:'小红书', icon:'📕', color:'#FF3B5C', bg:'linear-gradient(135deg, #FFF5F7, #FFEBEF)' },
  pengyouquan:  { name:'朋友圈', icon:'💬', color:'#34C759', bg:'linear-gradient(135deg, #F0FFF4, #E0FFE8)' },
  weibo:        { name:'微博',   icon:'🔥', color:'#FF8200', bg:'linear-gradient(135deg, #FFF8F2, #FFF0E5)' },
  douyin:       { name:'抖音',   icon:'🎵', color:'#1D1D1F', bg:'linear-gradient(135deg, #F8F8FA, #EFEFF2)' },
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // GET: 返回社区内容
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, cards: communityCards.slice(-20), total: communityCards.length }),
    };
  }

  // POST: 发布新内容
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ success: false, error: '仅支持 GET/POST' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { product, title, content, tags, platform } = body;

    if (!product || !title || !content) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: '缺少必填字段 product/title/content' }) };
    }

    const plat = PLATFORM_MAP[platform] || PLATFORM_MAP.xiaohongshu;

    const card = {
      id: Date.now(),
      platform: platform || 'xiaohongshu',
      product: product.slice(0, 30),
      title: title.slice(0, 80),
      preview: content.slice(0, 35),
      content: content.slice(0, 500),
      tags: (tags || []).slice(0, 5),
      platformName: plat.name,
      platformIcon: plat.icon,
      platformColor: plat.color,
      platformBg: plat.bg,
      coverEmoji: '✍️',
      coverGradient: 'linear-gradient(135deg, #FFF0F5, #FFE8F0)',
      source: 'community',
    };

    communityCards.push(card);

    // 最多保留 50 条
    if (communityCards.length > 50) {
      communityCards = communityCards.slice(-50);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, card, total: communityCards.length }),
    };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: err.message }) };
  }
};