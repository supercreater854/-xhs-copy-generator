const WECHAT_ID = 'wxid_kx3igu2pzs2f22';

function loadHistory() {
  try { return wx.getStorageSync('history_v2') || []; } catch (_) { return []; }
}
function loadCollections() {
  try { return wx.getStorageSync('collections_v2') || []; } catch (_) { return []; }
}
function saveCollections(items) {
  try { wx.setStorageSync('collections_v2', items.slice(0, 50)); } catch (_) {}
}
function clearAll() {
  try { wx.clearStorageSync(); } catch (_) {}
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return '刚刚';
  if (diff < 3600) return Math.floor(diff / 60) + '分钟前';
  if (diff < 86400) return Math.floor(diff / 3600) + '小时前';
  return Math.floor(diff / 86400) + '天前';
}

Page({
  data: {
    // 统计
    totalGenerations: 0,
    totalCollections: 0,

    // 子视图
    view: 'main',        // 'main' | 'collections' | 'history'
    collections: [],
    history: []
  },

  onShow() {
    this._refresh();
  },

  _refresh() {
    const history = loadHistory();
    const collections = loadCollections();
    this.setData({
      totalGenerations: history.length,
      totalCollections: collections.length,
      collections: collections.slice(0, 20).map(c => ({
        ...c,
        timeAgo: c.savedAt ? timeAgo(c.savedAt) : ''
      })),
      history: history.slice(0, 20).map(h => ({
        ...h,
        timeAgo: h.time ? timeAgo(h.time) : ''
      }))
    });
  },

  /* === 主列表点击 === */
  onTapRow(e) {
    const key = e.currentTarget.dataset.key;
    wx.vibrateShort({ type: 'light' });

    if (key === 'collections') {
      this._refresh();
      this.setData({ view: 'collections' });
    } else if (key === 'history') {
      this._refresh();
      this.setData({ view: 'history' });
    } else if (key === 'contact') {
      wx.setClipboardData({
        data: WECHAT_ID,
        success: () => {
          wx.showModal({
            title: '已复制微信号',
            content: WECHAT_ID + '\n\n已复制到剪贴板，请在微信中搜索添加。',
            showCancel: false,
            confirmText: '知道了'
          });
        }
      });
    } else if (key === 'settings') {
      wx.showActionSheet({
        itemList: ['清除缓存', '清除全部数据'],
        success: (res) => {
          if (res.tapIndex === 0) {
            wx.showToast({ title: '缓存已清除', icon: 'success', duration: 1200 });
          } else if (res.tapIndex === 1) {
            wx.showModal({
              title: '确认清除',
              content: '将清除所有创作历史和收藏数据，不可恢复。',
              confirmText: '确定清除',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  clearAll();
                  this._refresh();
                  wx.showToast({ title: '已清除', icon: 'success', duration: 1200 });
                }
              }
            });
          }
        }
      });
    } else if (key === 'about') {
      wx.showModal({
        title: '超级马卡龙',
        content: '让灵感，更容易变成作品。\n\n版本 2.0.0\n\n超级马卡龙持续迭代中。\n如果你遇到问题、发现 Bug，\n或有更好的想法，欢迎告诉我们。',
        showCancel: false,
        confirmText: '好的'
      });
    }
  },

  /* === 子视图操作 === */
  onBackToMain() {
    this.setData({ view: 'main' });
  },

  onCopyItem(e) {
    const item = e.currentTarget.dataset.item;
    wx.vibrateShort({ type: 'light' });
    let text = '';
    if (item.title) text += item.title + '\n\n';
    if (item.content) text += item.content + '\n\n';
    if (item.hashtags && item.hashtags.length) {
      text += item.hashtags.map(t => '#' + t.replace(/^#/, '')).join(' ');
    }
    wx.setClipboardData({
      data: text,
      success: () => { wx.showToast({ title: '已复制', icon: 'success', duration: 1200 }); }
    });
  },

  onDeleteCollection(e) {
    const item = e.currentTarget.dataset.item;
    let collections = loadCollections();
    collections = collections.filter(c => !(c.title === item.title && c.content === item.content));
    saveCollections(collections);
    wx.showToast({ title: '已移除', icon: 'none', duration: 1000 });
    this._refresh();
    this.setData({ view: 'collections' });
  }
});