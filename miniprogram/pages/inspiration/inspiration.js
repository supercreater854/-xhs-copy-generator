const PLATFORMS = [
  { key: 'xiaohongshu', name: '小红书', icon: '📕', color: '#FF3B5C', bg: 'linear-gradient(135deg, #FFF5F7, #FFEBEF)' },
  { key: 'pengyouquan', name: '朋友圈', icon: '💬', color: '#34C759', bg: 'linear-gradient(135deg, #F0FFF4, #E0FFE8)' },
  { key: 'weibo', name: '微博', icon: '🔥', color: '#FF8200', bg: 'linear-gradient(135deg, #FFF8F2, #FFF0E5)' },
  { key: 'douyin', name: '抖音', icon: '🎵', color: '#1D1D1F', bg: 'linear-gradient(135deg, #F8F8FA, #EFEFF2)' }
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// 兜底：离线 + API 失败时用
const ALL_CARDS = [
  { id: 1, platform:'xiaohongshu', product:'兰蔻持妆粉底液', title:'干皮亲妈！兰蔻持妆粉底液真的太能打了', preview:'姐妹们我必须要说！这款粉底液真的拯救了我的沙漠大干皮…', content:'上脸是那种高级的奶油肌妆效，完全不卡粉不浮粉，持妆12小时不是梦！', tags:['粉底液推荐','干皮底妆','持妆神器'], platformName:'小红书', platformIcon:'📕', platformColor:'#FF3B5C', platformBg:'linear-gradient(135deg, #FFF5F7, #FFEBEF)', coverEmoji:'💄', coverGradient:'linear-gradient(135deg, #FFE0E8, #FFD0DB)' },
  { id: 2, platform:'xiaohongshu', product:'YSL小金条#21', title:'冷白皮天菜！YSL小金条21试色分享💄', preview:'等了半个月终于到手的小金条21号！冷调复古红真的太绝了…', content:'薄涂是那种很气质的水红色，厚涂就是气场女王的蓝调正红。质地哑而不干～', tags:['口红试色','显白口红','YSL'], platformName:'小红书', platformIcon:'📕', platformColor:'#FF3B5C', platformBg:'linear-gradient(135deg, #FFF5F7, #FFEBEF)', coverEmoji:'💄', coverGradient:'linear-gradient(135deg, #FFE0E8, #FFD0DB)' },
  { id: 3, platform:'pengyouquan', product:'周末咖啡馆', title:'发现一个宝藏角落☕', preview:'周六下午误打误撞进了一家藏在巷子里的咖啡馆。', content:'手冲咖啡是老板自己烘焙的豆子，阳光从老窗子洒进来，坐了一下午都不想走。', tags:['咖啡馆','周末','探店'], platformName:'朋友圈', platformIcon:'💬', platformColor:'#34C759', platformBg:'linear-gradient(135deg, #F0FFF4, #E0FFE8)', coverEmoji:'☕', coverGradient:'linear-gradient(135deg, #FFF0E0, #FFE8D0)' },
  { id: 4, platform:'weibo', product:'小米手环8', title:'#数码开箱# 两百块的智能手环，香爆了⌚', preview:'小米手环8用了半个月，总结了该有的都有，不该有的也没有。', content:'心率、血氧、睡眠监测都挺准，续航差不多两周。NFC公交门禁全搞定。', tags:['数码开箱','智能手环','小米'], platformName:'微博', platformIcon:'🔥', platformColor:'#FF8200', platformBg:'linear-gradient(135deg, #FFF8F2, #FFF0E5)', coverEmoji:'⌨️', coverGradient:'linear-gradient(135deg, #E8E8F0, #D8D8E8)' },
  { id: 5, platform:'douyin', product:'珀莱雅双抗精华', title:'熬夜党听好了！这个精华你必须知道⚡️', preview:'你敢信吗？用了两周脸直接亮了一个度！', content:'不到两百块，效果吊打大牌！质地超清爽，油皮完全没负担。熬夜党闭眼入！', tags:['精华推荐','熬夜护肤','学生党'], platformName:'抖音', platformIcon:'🎵', platformColor:'#1D1D1F', platformBg:'linear-gradient(135deg, #F8F8FA, #EFEFF2)', coverEmoji:'💄', coverGradient:'linear-gradient(135deg, #FFE0E8, #FFD0DB)' },
];

Page({
  data: {
    platforms: PLATFORMS,
    activeFilter: '',
    dailyPick: null,
    sections: [],
    allCards: [],
    activeCard: null,
    trending: [],
    trendingSource: '',
    imgState: {},
    loading: false,
    inspireSource: '离线数据',
  },

  onLoad() {
    this._fallbackRender();
    this._fetchInspire();
    this._fetchTrending();
  },

  onShow() {
    // 仅刷新热榜，不重新拉灵感（避免覆盖用户浏览）
    this._fetchTrending();
  },

  _fallbackRender() {
    const cards = shuffle(ALL_CARDS).slice(0, 5);
    const dailyPick = cards[0];
    const sections = PLATFORMS.map(plat => ({
      key: plat.key,
      title: plat.icon + ' ' + plat.name + '精选',
      cards: cards.filter(c => c.platform === plat.key).slice(0, 4)
    }));
    this.setData({
      dailyPick, sections, allCards: cards, activeFilter: '',
      trending: [{ rank:1, title:'兰蔻持妆粉底液测评', hot:'128万' }],
      trendingSource:'精选推荐', inspireSource:'离线数据'
    });
  },

  async _fetchInspire() {
    this.setData({ loading: true });
    try {
      const app = getApp();
      const base = app.globalData.apiUrl.replace(/\/api\/generate$/, '');
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: base + '/api/inspire?count=12',
          method: 'GET',
          timeout: 35000,
          success: resolve,
          fail: reject,
        });
      });
      if (res.statusCode === 200 && res.data && res.data.success && Array.isArray(res.data.cards)) {
        const cards = res.data.cards;
        const dailyPick = cards[Math.floor(Math.random() * cards.length)] || cards[0];
        const sections = PLATFORMS.map(plat => ({
          key: plat.key,
          title: plat.icon + ' ' + plat.name + '精选',
          cards: cards.filter(c => c.platform === plat.key).slice(0, 4)
        }));
        this.setData({
          dailyPick, sections, allCards: cards, activeFilter: '', loading: false,
          inspireSource: 'AI 实时生成',
        });
      }
    } catch (_) {
      this.setData({ loading: false });
      // 兜底已在 _fallbackRender 中设置
    }
  },

  async _fetchTrending() {
    try {
      const app = getApp();
      const base = app.globalData.apiUrl.replace(/\/api\/generate$/, '');
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: base + '/api/trending',
          method: 'GET',
          timeout: 8000,
          success: resolve,
          fail: reject,
        });
      });
      if (res.statusCode === 200 && res.data && res.data.success) {
        this.setData({
          trending: (res.data.items || []).slice(0, 10),
          trendingSource: res.data.source || '实时热榜',
        });
      }
    } catch (_) {}
  },

  onRefresh() {
    wx.vibrateShort({ type: 'light' });
    this._fetchInspire();
    this._fetchTrending();
    wx.showToast({ title: '正在拉取最新数据...', icon: 'loading', duration: 1000 });
  },

  onFilter(e) {
    this.setData({ activeFilter: e.currentTarget.dataset.key });
  },

  onCardTap(e) {
    this.setData({ activeCard: e.currentTarget.dataset.card });
  },

  onCloseModal() {
    this.setData({ activeCard: null });
  },

  onCopyCard() {
    const card = this.data.activeCard;
    if (!card) return;
    const text = card.title + '\n\n' + card.content + '\n\n' + (card.tags || []).map(t => '#' + t).join(' ');
    wx.setClipboardData({
      data: text,
      success() { wx.showToast({ title: '已复制整篇', icon: 'success', duration: 1200 }); }
    });
  },

  onUseCard() {
    const card = this.data.activeCard;
    if (!card) return;
    wx.switchTab({ url: '/pages/index/index' });
    const app = getApp();
    app.inspireData = { product: card.product, platform: card.platform };
  },

  onImgLoad(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ imgState: { ...this.data.imgState, [id]: 'loaded' } });
  },

  onImgError(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ imgState: { ...this.data.imgState, [id]: 'error' } });
  }
});