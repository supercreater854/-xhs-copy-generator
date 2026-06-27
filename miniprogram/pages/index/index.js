const app = getApp();

const PLATFORMS = [
  { key: 'xiaohongshu', name: '小红书', icon: '📕', color: '#FF3B5C', gradient: 'linear-gradient(135deg, #FF3B5C, #FF6B81)' },
  { key: 'pengyouquan', name: '朋友圈', icon: '💬', color: '#34C759', gradient: 'linear-gradient(135deg, #34C759, #5EDC7A)' },
  { key: 'weibo', name: '微博', icon: '🔥', color: '#FF8200', gradient: 'linear-gradient(135deg, #FF8200, #FFA040)' },
  { key: 'douyin', name: '抖音', icon: '🎵', color: '#1D1D1F', gradient: 'linear-gradient(135deg, #1D1D1F, #3A3A3C)' }
];

const PLATFORM_PROMPTS = {
  xiaohongshu: '生成小红书风格的文案：语气亲切如姐妹分享，多用emoji和网络热词，80-150字。',
  pengyouquan: '生成朋友圈风格的文案：真实自然如日常分享，简洁有力，30-80字。',
  weibo: '生成微博风格的文案：精炼有梗，可带话题标签，50-100字。',
  douyin: '生成抖音风格的文案：开头有强力钩子，节奏快抓眼球，30-60字。'
};

const PLATFORM_NAMES = {
  xiaohongshu: '小红书', pengyouquan: '朋友圈', weibo: '微博', douyin: '抖音'
};

const PLATFORM_COLORS = {
  xiaohongshu: '#FF3B5C', pengyouquan: '#34C759', weibo: '#FF8200', douyin: '#1D1D1F'
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

function formatHistory(history) {
  return history.slice(0, 20).map(h => ({
    ...h,
    timeAgo: timeAgo(h.time),
    platDots: (h.platforms || []).map(k => ({ color: PLATFORM_COLORS[k] || '#AEAEB2' }))
  }));
}

function fullPost(variant) {
  return variant.title + '\n\n' + variant.content + '\n\n' + (variant.hashtags || []).map(t => '#' + t.replace(/^#/, '')).join(' ');
}

function isCollected(collections, variant) {
  if (!variant) return false;
  return collections.some(c => c.title === variant.title && c.content === variant.content);
}

Page({
  data: {
    prompt: '',
    loading: false,
    result: null,           // { variants: [...] }
    activeVariant: 0,       // 0/1/2
    isCollected: false,
    error: '',
    platforms: PLATFORMS,
    activePlatforms: ['xiaohongshu'],
    hotTags: ['口红', '防晒霜', '粉底液', '精华', '面霜', '眼影盘', '腮红'],
    sceneTags: ['干皮夏日底妆', '通勤穿搭推荐', '平价好物分享', '学生党护肤', '周末探店打卡', '换季敏感肌'],
    activeTag: '',
    history: [],
    collections: [],
    examples: [
      {
        platform: 'xiaohongshu',
        platformName: '小红书',
        product: '兰蔻持妆粉底液',
        variants: [{
          style: '种草风',
          title: '干皮亲妈！兰蔻持妆粉底液真的太能打了💄',
          content: '姐妹们我必须要说！这款粉底液真的拯救了我的沙漠大干皮😭\n\n上脸是那种高级的奶油肌妆效，完全不卡粉不浮粉，持妆12小时不是梦✨\n\n重点是氧化程度几乎为零，带妆一整天还是白白净净的。我买的是PO-01色号，黄一白刚刚好～',
          hashtags: ['兰蔻粉底液', '干皮底妆', '持妆粉底', '奶油肌', '粉底液推荐']
        }]
      },
      {
        platform: 'pengyouquan',
        platformName: '朋友圈',
        product: 'MAC Chili口红',
        variants: [{
          style: '种草风',
          title: '跟风入了MAC Chili，确实好看💋',
          content: '好久没买新口红了，被同事种草了Chili。\n\n颜色是真的显白，黄皮也能hold住。哑光质地不干，涂之前打个底就很好。日常薄涂就很提气色。',
          hashtags: ['MAC口红', 'Chili试色', '显白口红', '日常口红']
        }]
      },
      {
        platform: 'douyin',
        platformName: '抖音',
        product: '珀莱雅双抗精华',
        variants: [{
          style: '种草风',
          title: '熬夜党听好了！这个精华你必须知道⚡️',
          content: '你敢信吗？用了两周脸直接亮了一个度！\n\n珀莱雅双抗精华，不到两百块，效果吊打大牌！质地超清爽，油皮也完全没负担。\n\n熬夜党、暗沉肌、学生党——闭眼入！',
          hashtags: ['双抗精华', '熬夜护肤', '平价精华', '学生党护肤', '珀莱雅']
        }]
      }
    ]
  },

  onLoad() {
    this.setData({
      history: formatHistory(loadHistory()),
      collections: loadCollections()
    });
  },

  onShow() {
    this.setData({
      history: formatHistory(loadHistory()),
      collections: loadCollections()
    });
    const app = getApp();
    if (app.inspireData) {
      const { product, platform } = app.inspireData;
      this.setData({ prompt: product, activePlatforms: [platform], activeTag: '' });
      app.inspireData = null;
    }
  },

  onInput(e) {
    this.setData({ prompt: e.detail.value, error: '', activeTag: '' });
  },

  onTagTap(e) {
    const tag = e.currentTarget.dataset.tag;
    wx.vibrateShort({ type: 'light' });
    this.setData({ prompt: tag, activeTag: tag, error: '' });
  },

  onPlatformTap(e) {
    wx.vibrateShort({ type: 'light' });
    const key = e.currentTarget.dataset.key;
    let active = this.data.activePlatforms;
    if (active.includes(key)) {
      if (active.length === 1) return;
      active = active.filter(k => k !== key);
    } else {
      active = [...active, key];
    }
    this.setData({ activePlatforms: active });
  },

  onExampleTap(e) {
    wx.vibrateShort({ type: 'light' });
    const idx = e.currentTarget.dataset.index;
    const ex = this.data.examples[idx];
    this.setData({
      prompt: ex.product,
      activePlatforms: [ex.platform],
      result: { variants: ex.variants },
      activeVariant: 0,
      error: ''
    });
  },

  onGenerate() {
    const prompt = this.data.prompt.trim();
    if (!prompt) {
      this.setData({ error: '请输入产品、场景或需求' });
      return;
    }
    wx.vibrateShort({ type: 'medium' });
    this._doGenerate(prompt);
  },

  onRegenerate() {
    const prompt = this.data.prompt.trim();
    if (prompt) this._doGenerate(prompt);
  },

  _doGenerate(basePrompt) {
    const platformInstructions = this.data.activePlatforms
      .map(k => PLATFORM_PROMPTS[k])
      .join(' ');
    const fullPrompt = `${platformInstructions} 主题：${basePrompt}。`;

    this.setData({ loading: true, result: null, error: '', activeVariant: 0 });

    wx.request({
      url: app.globalData.apiUrl,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: { prompt: fullPrompt },
      success: (res) => {
        const data = res.data;
        // 新格式: { variants: [...] }
        if (data && data.success && data.variants) {
          this.setData({ result: { variants: data.variants }, loading: false });
        }
        // 兼容旧格式
        else if (data && data.success && data.titles) {
          const compat = data.titles.map((t, i) => ({
            style: '种草风',
            title: t,
            content: data.contents[i] || '',
            hashtags: []
          }));
          this.setData({ result: { variants: compat }, loading: false });
        } else {
          this.setData({ error: (data && data.error) || '生成失败，请重试', loading: false });
          return;
        }

        // 存历史
        const history = loadHistory();
        history.unshift({ prompt: basePrompt, platforms: [...this.data.activePlatforms], time: Date.now() });
        saveHistory(history);
        this.setData({ history: formatHistory(history) });
        this._updateCollectedState();
      },
      fail: (err) => {
        this.setData({ error: '网络请求失败: ' + (err.errMsg || '未知错误'), loading: false });
      }
    });
  },

  _updateCollectedState() {
    const r = this.data.result;
    if (!r || !r.variants) { this.setData({ isCollected: false }); return; }
    const v = r.variants[this.data.activeVariant];
    this.setData({ isCollected: isCollected(loadCollections(), v) });
  },

  onVariantTap(e) {
    wx.vibrateShort({ type: 'light' });
    this.setData({ activeVariant: parseInt(e.currentTarget.dataset.index) });
    this._updateCollectedState();
  },

  onSwipeResult(e) {
    const dir = e.detail.dx;
    if (Math.abs(dir) < 40) return;
    const curr = this.data.activeVariant;
    const max = (this.data.result && this.data.result.variants) ? this.data.result.variants.length - 1 : 0;
    if (dir < 0 && curr < max) this.setData({ activeVariant: curr + 1 });
    if (dir > 0 && curr > 0) this.setData({ activeVariant: curr - 1 });
  },

  onCopyAll() {
    wx.vibrateShort({ type: 'medium' });
    const r = this.data.result;
    if (!r || !r.variants) return;
    const v = r.variants[this.data.activeVariant];
    const text = fullPost(v);
    wx.setClipboardData({
      data: text,
      success() { wx.showToast({ title: '已复制整篇，去粘贴吧', icon: 'success', duration: 1800 }); }
    });
  },

  onCopyText(e) {
    wx.vibrateShort({ type: 'light' });
    wx.setClipboardData({
      data: e.currentTarget.dataset.text,
      success() { wx.showToast({ title: '已复制', icon: 'success', duration: 1200 }); }
    });
  },

  onToggleCollect() {
    wx.vibrateShort({ type: 'light' });
    const r = this.data.result;
    if (!r || !r.variants) return;
    const v = r.variants[this.data.activeVariant];
    let collections = loadCollections();
    if (isCollected(collections, v)) {
      collections = collections.filter(c => !(c.title === v.title && c.content === v.content));
      wx.showToast({ title: '已取消收藏', icon: 'none', duration: 1000 });
    } else {
      collections.unshift({ ...v, savedAt: Date.now() });
      wx.showToast({ title: '已收藏', icon: 'success', duration: 1200 });
    }
    saveCollections(collections);
    this.setData({ collections });
  },

  onHistoryTap(e) {
    const item = e.currentTarget.dataset.item;
    this.setData({ prompt: item.prompt, activeTag: '', activePlatforms: item.platforms || ['xiaohongshu'] });
    this._doGenerate(item.prompt);
  },

  onClearHistory() {
    saveHistory([]);
    this.setData({ history: [] });
  },

  onShareAppMessage() {
    return { title: '超级马卡龙 - 多平台文案生成', path: '/pages/index/index' };
  },
  onShareTimeline() {
    return { title: '超级马卡龙 - 一键生成多平台爆款文案' };
  }
});