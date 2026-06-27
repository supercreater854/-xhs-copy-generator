const app = getApp();

/* 文案长度 */
const LENGTH_MODES = [
  { key: 'smart',    label: '智能',   hint: 'AI 自动',  words: '自适应' },
  { key: 'inspire',  label: '灵感',   hint: '精简',     words: '50-100字' },
  { key: 'standard', label: '标准',   hint: '推荐',     words: '150-300字' },
  { key: 'deep',     label: '深度',   hint: '详实',     words: '400-700字' },
  { key: 'long',     label: '长文',   hint: '完整',     words: '800-1500字' }
];

/* 动态主题色 */
const THEME_MAP = {
  smart:    { accent: '#34C759', light: '#F0FFF4', glow: 'rgba(52,199,89,0.12)',  shadow: 'rgba(52,199,89,0.25)',  border: 'rgba(52,199,89,0.10)' },
  inspire:  { accent: '#FF9F43', light: '#FFF8F0', glow: 'rgba(255,159,67,0.12)',  shadow: 'rgba(255,159,67,0.28)',  border: 'rgba(255,159,67,0.10)' },
  standard: { accent: '#FF6B8A', light: '#FFF5F7', glow: 'rgba(255,107,138,0.12)', shadow: 'rgba(255,107,138,0.28)', border: 'rgba(255,107,138,0.10)' },
  deep:     { accent: '#C4A6FF', light: '#F8F4FF', glow: 'rgba(196,166,255,0.12)', shadow: 'rgba(196,166,255,0.28)', border: 'rgba(196,166,255,0.10)' },
  long:     { accent: '#7DC4FF', light: '#F0F7FF', glow: 'rgba(125,196,255,0.12)',  shadow: 'rgba(125,196,255,0.28)',  border: 'rgba(125,196,255,0.10)' }
};

/* 风格 — 8套 Writing Profile，切换风格=换作者 */
const STYLES = [
  { key: 'smart',   label: '智能',     desc: '自动选择最佳写法' },
  { key: 'natural', label: '自然分享', desc: '像朋友聊天分享' },
  { key: 'viral',   label: '爆款吸引', desc: '制造好奇和共鸣' },
  { key: 'pro',     label: '专业深析', desc: '深度分析有层次' },
  { key: 'story',   label: '故事叙述', desc: '用故事打动读者' },
  { key: 'minimal', label: '极简精炼', desc: '精准克制有留白' },
  { key: 'emotion', label: '情绪共鸣', desc: '温暖共情有力量' },
  { key: 'convert', label: '说服行动', desc: '逻辑推进促行动' }
];

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return '刚刚';
  if (diff < 3600) return Math.floor(diff / 60) + '分钟前';
  if (diff < 86400) return Math.floor(diff / 3600) + '小时前';
  return Math.floor(diff / 86400) + '天前';
}

function loadHistory() {
  try { return wx.getStorageSync('history_v2') || []; } catch (_) { return []; }
}
function saveHistory(items) {
  try { wx.setStorageSync('history_v2', items.slice(0, 20)); } catch (_) {}
}

/* 为 WXML 预计算所有选择器的样式，避免模板表达式静默失败 */
function buildItems(baseItems, currentTheme, activeKey, keyField) {
  return baseItems.map(item => {
    const isActive = item[keyField] === activeKey;
    return {
      ...item,
      isActive,
      activeStyle: isActive
        ? 'border-color:' + currentTheme.accent + '; background:' + currentTheme.light + '; box-shadow: 0 4rpx 18rpx ' + currentTheme.shadow
        : '',
      labelStyle: isActive ? 'color:' + currentTheme.accent : '',
      descStyle: isActive ? 'color:' + currentTheme.accent : ''
    };
  });
}

Page({
  data: {
    prompt: '',
    activeLength: 'standard',
    activeStyle: 'smart',
    advancedOpen: false,
    theme: THEME_MAP.standard,
    // 预计算的选择器数据 — WXML 只需 {{item.isActive}} 和 {{item.activeStyle}}
    lengthModes: [],
    styleItems: [],
    history: []
  },

  onLoad() {
    this._applyTheme();
    this.setData({ history: this._fmtHistory(loadHistory()) });
  },

  _applyTheme(lengthKey) {
    const key = lengthKey || this.data.activeLength;
    const t = THEME_MAP[key] || THEME_MAP.standard;
    this.setData({
      theme: t,
      activeLength: key,
      lengthModes: buildItems(LENGTH_MODES, t, key, 'key'),
      styleItems: buildItems(STYLES, t, this.data.activeStyle, 'key')
    });
  },

  onShow() {
    this.setData({ history: this._fmtHistory(loadHistory()) });
  },

  _fmtHistory(raw) {
    return raw.slice(0, 20).map(h => ({
      ...h, timeAgo: timeAgo(h.time)
    }));
  },

  _refreshTheme(styleKey) {
    const sKey = styleKey || this.data.activeStyle;
    const t = this.data.theme;
    this.setData({
      activeStyle: sKey,
      lengthModes: buildItems(LENGTH_MODES, t, this.data.activeLength, 'key'),
      styleItems: buildItems(STYLES, t, sKey, 'key')
    });
  },

  onInput(e) {
    this.setData({ prompt: e.detail.value });
  },

  onLengthTap(e) {
    wx.vibrateShort({ type: 'light' });
    this._applyTheme(e.currentTarget.dataset.key);
  },

  onStyleTap(e) {
    wx.vibrateShort({ type: 'light' });
    this._refreshTheme(e.currentTarget.dataset.key);
  },

  onToggleAdvanced() {
    wx.vibrateShort({ type: 'light' });
    this.setData({ advancedOpen: !this.data.advancedOpen });
  },

  onGenerate() {
    const prompt = this.data.prompt.trim();
    if (!prompt) {
      wx.showToast({ title: '请输入内容', icon: 'none', duration: 1500 });
      return;
    }
    wx.vibrateShort({ type: 'medium' });

    const config = {
      prompt,
      length: this.data.activeLength,
      style: this.data.activeStyle
    };

    const history = loadHistory();
    history.unshift({ prompt, length: this.data.activeLength, time: Date.now() });
    saveHistory(history);
    this.setData({ history: this._fmtHistory(history) });

    wx.navigateTo({
      url: '/pages/result/result?config=' + encodeURIComponent(JSON.stringify(config))
    });
  },

  onHistoryTap(e) {
    const item = e.currentTarget.dataset.item;
    wx.vibrateShort({ type: 'light' });
    this.setData({ prompt: item.prompt });
    this._applyTheme(item.length || 'standard');
    this.onGenerate();
  },

  onClearHistory() {
    saveHistory([]);
    this.setData({ history: [] });
  }
});