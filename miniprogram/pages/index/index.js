const app = getApp();

const STYLE_PROMPTS = {
  nature: '',
  exaggerated: '请使用夸张、戏剧化的语气，多用感叹号和emoji。',
  tips: '请使用干货分享的语气，列出具体使用技巧和注意事项。',
  conversational: '请使用朋友聊天般的口语化语气，多用问句和互动表达。'
};

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return '刚刚';
  if (diff < 3600) return Math.floor(diff / 60) + '分钟前';
  if (diff < 86400) return Math.floor(diff / 3600) + '小时前';
  return Math.floor(diff / 86400) + '天前';
}

function loadHistory() {
  try { return wx.getStorageSync('xhs_history') || []; } catch (_) { return []; }
}

function saveHistory(items) {
  try { wx.setStorageSync('xhs_history', items.slice(0, 10)); } catch (_) {}
}

Page({
  data: {
    prompt: '',
    loading: false,
    result: null,
    error: '',
    hotTags: ['口红', '防晒霜', '粉底液', '精华', '面霜', '眼影盘', '腮红', '洗面奶', '面膜', '香水'],
    activeTag: '',
    styles: [
      { label: '自然', value: 'nature' },
      { label: '夸张', value: 'exaggerated' },
      { label: '干货', value: 'tips' },
      { label: '对话', value: 'conversational' }
    ],
    activeStyle: 'nature',
    history: []
  },

  onLoad() {
    this.setData({ history: loadHistory().map(h => ({ ...h, timeAgo: timeAgo(h.time) })) });
  },

  onInput(e) {
    this.setData({ prompt: e.detail.value, error: '', activeTag: '' });
  },

  onTagTap(e) {
    const tag = e.currentTarget.dataset.tag;
    this.setData({ prompt: tag, activeTag: tag, error: '' });
  },

  onStyleTap(e) {
    this.setData({ activeStyle: e.currentTarget.dataset.style });
  },

  onGenerate() {
    const prompt = this.data.prompt.trim();
    if (!prompt) {
      this.setData({ error: '请输入产品名称或主题' });
      return;
    }
    this._doGenerate(prompt);
  },

  onRegenerate() {
    const prompt = this.data.prompt.trim();
    if (prompt) this._doGenerate(prompt);
  },

  _doGenerate(basePrompt) {
    const styleExtra = STYLE_PROMPTS[this.data.activeStyle] || '';
    const fullPrompt = styleExtra ? basePrompt + '。' + styleExtra : basePrompt;

    this.setData({ loading: true, result: null, error: '' });

    wx.request({
      url: app.globalData.apiUrl,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: { prompt: fullPrompt },
      success: (res) => {
        const data = res.data;
        if (data && data.success && data.titles) {
          this.setData({ result: data, loading: false });

          // 存历史
          const history = loadHistory();
          history.unshift({ prompt: basePrompt, time: Date.now() });
          saveHistory(history);
          this.setData({ history: history.slice(0, 10).map(h => ({ ...h, timeAgo: timeAgo(h.time) })) });
        } else {
          this.setData({ error: (data && data.error) || '生成失败，请重试', loading: false });
        }
      },
      fail: (err) => {
        this.setData({ error: '网络请求失败: ' + (err.errMsg || '未知错误'), loading: false });
      }
    });
  },

  onCopy(e) {
    wx.setClipboardData({
      data: e.currentTarget.dataset.text,
      success() { wx.showToast({ title: '已复制', icon: 'success', duration: 1200 }); }
    });
  },

  onCopyAll() {
    const r = this.data.result;
    if (!r) return;
    const all = [...r.titles, '', ...r.contents].join('\n');
    wx.setClipboardData({
      data: all,
      success() { wx.showToast({ title: '已复制全部', icon: 'success', duration: 1500 }); }
    });
  },

  onHistoryTap(e) {
    const item = e.currentTarget.dataset.item;
    this.setData({ prompt: item.prompt, activeTag: '' });
    this._doGenerate(item.prompt);
  },

  onClearHistory() {
    saveHistory([]);
    this.setData({ history: [] });
  }
});