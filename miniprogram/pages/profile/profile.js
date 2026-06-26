const PLATFORM_COLORS = {
  xiaohongshu: '#FF3B5C',
  pengyouquan: '#34C759',
  weibo: '#FF8200',
  douyin: '#1D1D1F'
};

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return '刚刚';
  if (diff < 3600) return Math.floor(diff / 60) + '分钟前';
  if (diff < 86400) return Math.floor(diff / 3600) + '小时前';
  return Math.floor(diff / 86400) + '天前';
}

function loadHistory() {
  try { return wx.getStorageSync('macaron_history') || []; } catch (_) { return []; }
}
function saveHistory(items) {
  try { wx.setStorageSync('macaron_history', items.slice(0, 20)); } catch (_) {}
}
function loadCollections() {
  try { return wx.getStorageSync('macaron_collections') || []; } catch (_) { return []; }
}
function saveCollections(items) {
  try { wx.setStorageSync('macaron_collections', items.slice(0, 50)); } catch (_) {}
}

Page({
  data: {
    history: [],
    collections: [],
    totalGenerations: 0,
    platformCount: 0
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const history = loadHistory().map(h => ({
      ...h,
      timeAgo: timeAgo(h.time),
      platDots: (h.platforms || []).map(k => ({ color: PLATFORM_COLORS[k] || '#AEAEB2' }))
    }));
    const collections = loadCollections();
    const totalGenerations = history.length;
    const allPlatforms = new Set();
    history.forEach(h => (h.platforms || []).forEach(p => allPlatforms.add(p)));
    const platformCount = allPlatforms.size;

    this.setData({ history, collections, totalGenerations, platformCount });
  },

  onHistoryTap(e) {
    const item = e.currentTarget.dataset.item;
    wx.switchTab({ url: '/pages/index/index' });
  },

  onCollectionTap(e) {
    const item = e.currentTarget.dataset.item;
    const text = item.title + '\n\n' + item.content + '\n\n' + (item.hashtags || []).map(t => '#' + t.replace(/^#/, '')).join(' ');
    wx.setClipboardData({
      data: text,
      success() { wx.showToast({ title: '已复制', icon: 'success', duration: 1200 }); }
    });
  },

  onClearHistory() {
    wx.showModal({
      title: '确认清空',
      content: '将清除全部历史记录',
      success: (res) => {
        if (res.confirm) {
          saveHistory([]);
          this.refresh();
        }
      }
    });
  },

  onClearCollections() {
    wx.showModal({
      title: '确认清空',
      content: '将清除全部收藏',
      success: (res) => {
        if (res.confirm) {
          saveCollections([]);
          this.refresh();
        }
      }
    });
  }
});