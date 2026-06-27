const app = getApp();

const API_URL = 'https://genuine-tarsier-79ba2b.netlify.app/api/generate';

/* 卡片操作的额外指令 */
const ACTION_INSTRUCTIONS = {
  polish:  '请润色优化这篇文章，使表达更流畅自然，但保持原有风格和结构。',
  expand:  '请扩写这篇文章，增加更多细节、案例和数据支撑，让内容更丰满。',
  shorten: '请缩写这篇文章，保留核心信息和观点，去掉冗余。',
  deai:    '请重写这篇文章，去掉明显的AI痕迹，让表达更像真人手写，可以加入口语化表达和个人感受。'
};

function loadCollections() {
  try { return wx.getStorageSync('collections_v2') || []; } catch (_) { return []; }
}
function saveCollections(items) {
  try { wx.setStorageSync('collections_v2', items.slice(0, 50)); } catch (_) {}
}
function isCollected(collections, card) {
  return collections.some(c => c.title === card.title && c.content === card.content);
}

Page({
  data: {
    loading: true,
    error: '',
    config: null,
    cards: [],
    collected: {},
    actionLoading: false
  },

  onLoad(options) {
    let config;
    try {
      config = JSON.parse(decodeURIComponent(options.config || '{}'));
    } catch (_) {
      this.setData({ loading: false, error: '参数错误' });
      return;
    }
    this.setData({ config });
    this._generate(config);
  },

  /* 构建用户消息 — 仅组合原始输入，风格/长度由后端 Writing Profile 处理 */
  _buildMessage(config, extraAction) {
    let msg = config.prompt.trim();
    if (extraAction) {
      msg = extraAction + '\n\n原文内容：' + msg;
    }
    msg += '\n\n请严格按照JSON格式返回结果。';
    return msg;
  },

  _generate(config, extraAction) {
    this.setData({ loading: true, error: '', cards: [] });

    wx.showLoading({ title: '正在创作...', mask: true });

    const prompt = this._buildMessage(config, extraAction);

    wx.request({
      url: API_URL,
      method: 'POST',
      timeout: 45000,
      header: { 'Content-Type': 'application/json' },
      data: {
        prompt,
        length: config.length || 'standard',
        style: config.style || 'smart'
      },
      success: (res) => {
        wx.hideLoading();
        const data = res.data;

        if (res.statusCode !== 200) {
          const msg = (data && data.error) || ('服务器错误 (' + res.statusCode + ')');
          this.setData({ error: msg, loading: false });
          return;
        }

        if (data && data.success && data.variants) {
          const cards = data.variants.slice(0, 3).map((c, i) => ({ ...c, _k: 'v' + i }));
          const collections = loadCollections();
          const collected = {};
          cards.forEach((c, i) => {
            collected[i] = isCollected(collections, c);
          });
          this.setData({ cards, collected, loading: false });
        } else {
          this.setData({ error: (data && data.error) || '生成失败，请返回重试', loading: false });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        const errMsg = err.errMsg || '';
        let msg = '网络请求失败';
        if (errMsg.includes('timeout')) {
          msg = '请求超时，请检查网络后重试';
        } else if (errMsg.includes('fail')) {
          msg = '无法连接服务器，请检查网络';
        }
        this.setData({ error: msg, loading: false });
      }
    });
  },

  onCardAction(e) {
    const { action, card } = e.detail;
    wx.vibrateShort({ type: 'light' });

    if (action === 'regenerate') {
      this._generate(this.data.config);
      return;
    }

    if (action === 'collect') {
      let collections = loadCollections();
      if (this.data.collected[this.data.cards.indexOf(card)]) {
        collections = collections.filter(c => !(c.title === card.title && c.content === card.content));
        wx.showToast({ title: '已取消收藏', icon: 'none', duration: 1000 });
      } else {
        collections.unshift({ ...card, savedAt: Date.now() });
        wx.showToast({ title: '已收藏', icon: 'success', duration: 1200 });
      }
      saveCollections(collections);
      const collected = { ...this.data.collected };
      collected[this.data.cards.indexOf(card)] = isCollected(collections, card);
      this.setData({ collected });
      return;
    }

    const extra = ACTION_INSTRUCTIONS[action];
    if (extra) {
      this.setData({ actionLoading: true });
      const newConfig = {
        ...this.data.config,
        prompt: card.content || this.data.config.prompt
      };
      this._generate(newConfig, extra);
      setTimeout(() => this.setData({ actionLoading: false }), 500);
    }
  },

  onContinue(e) {
    const act = e.currentTarget.dataset.action;
    wx.vibrateShort({ type: 'light' });
    if (act === 'change-platform') {
      wx.navigateBack();
    } else if (act === 'more') {
      this._generate(this.data.config, '请生成不同角度的版本。');
    } else {
      wx.showToast({ title: '即将支持', icon: 'none', duration: 1200 });
    }
  },

  onBack() {
    wx.navigateBack();
  }
});