// Netlify Function: 实时热榜代理
// 抓取微博热搜，返回前 15 条

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

// 多源回退
const SOURCES = [
  {
    name: '微博热搜',
    url: 'https://tenapi.cn/v2/weibohot',
    parse: (data) => {
      if (data.code === 200 && Array.isArray(data.data)) {
        return data.data.slice(0, 15).map((item, i) => ({
          rank: i + 1,
          title: item.name || item.title || '',
          hot: item.hot || '',
          url: item.url || '',
        }));
      }
      return null;
    },
  },
  {
    name: '知乎热榜',
    url: 'https://tenapi.cn/v2/zhihuhot',
    parse: (data) => {
      if (data.code === 200 && Array.isArray(data.data)) {
        return data.data.slice(0, 15).map((item, i) => ({
          rank: i + 1,
          title: item.name || item.title || item.query || '',
          hot: item.hot || item.follower_count || '',
          url: item.url || '',
        }));
      }
      return null;
    },
  },
];

// 兜底数据
const FALLBACK = [
  { rank: 1, title: '兰蔻持妆粉底液测评', hot: '128万' },
  { rank: 2, title: 'YSL小金条试色', hot: '96万' },
  { rank: 3, title: '珀莱雅双抗精华', hot: '85万' },
  { rank: 4, title: '平价防晒推荐', hot: '72万' },
  { rank: 5, title: 'MAC Chili口红', hot: '63万' },
  { rank: 6, title: '小米手环8开箱', hot: '51万' },
];

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // 依次尝试每个数据源
  for (const source of SOURCES) {
    try {
      const res = await fetch(source.url, {
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const items = source.parse(data);
      if (items && items.length > 0) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            source: source.name,
            items,
            updatedAt: new Date().toISOString(),
          }),
        };
      }
    } catch (_) {
      continue;
    }
  }

  // 全部失败 → 兜底
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      source: '精选推荐',
      items: FALLBACK,
      updatedAt: new Date().toISOString(),
      cached: true,
    }),
  };
};