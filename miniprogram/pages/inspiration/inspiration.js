const PLATFORMS = [
  { key: 'xiaohongshu', name: '小红书', icon: '📕', color: '#FF3B5C', bg: 'linear-gradient(135deg, #FFF5F7, #FFEBEF)' },
  { key: 'pengyouquan', name: '朋友圈', icon: '💬', color: '#34C759', bg: 'linear-gradient(135deg, #F0FFF4, #E0FFE8)' },
  { key: 'weibo', name: '微博', icon: '🔥', color: '#FF8200', bg: 'linear-gradient(135deg, #FFF8F2, #FFF0E5)' },
  { key: 'douyin', name: '抖音', icon: '🎵', color: '#1D1D1F', bg: 'linear-gradient(135deg, #F8F8FA, #EFEFF2)' }
];

const PLATFORM_NAMES = { xiaohongshu: '小红书', pengyouquan: '朋友圈', weibo: '微博', douyin: '抖音' };

// 产品类别 → 封面 emoji + 渐变 + 图片关键词
const CATEGORY_COVERS = [
  { keys:['粉底','口红','精华','面膜','眉笔','防晒','护肤','美妆','试色','底妆'], emoji:'💄', gradient:'linear-gradient(135deg, #FFE0E8, #FFD0DB)', img:'makeup+cosmetics' },
  { keys:['咖啡','早餐','美食','探店'], emoji:'☕', gradient:'linear-gradient(135deg, #FFF0E0, #FFE8D0)', img:'coffee+cafe' },
  { keys:['键盘','数码','手环','手机','科技'], emoji:'⌨️', gradient:'linear-gradient(135deg, #E8E8F0, #D8D8E8)', img:'tech+gadget' },
  { keys:['穿搭','衣服','鞋','包'], emoji:'👗', gradient:'linear-gradient(135deg, #FFF0F5, #FFE0EC)', img:'fashion+outfit' },
];
const DEFAULT_COVER = { emoji:'✨', gradient:'linear-gradient(135deg, #FFF5F7, #FFEBEF)', img:'product+lifestyle' };

function getCover(product) {
  for (const cat of CATEGORY_COVERS) {
    if (cat.keys.some(k => product.includes(k))) return cat;
  }
  return DEFAULT_COVER;
}

const ALL_CARDS = [
  { id: 1, platform:'xiaohongshu', product:'兰蔻持妆粉底液', title:'干皮亲妈！兰蔻持妆粉底液真的太能打了', preview:'姐妹们我必须要说！这款粉底液真的拯救了我的沙漠大干皮…', content:'姐妹们我必须要说！这款粉底液真的拯救了我的沙漠大干皮😭\n\n上脸是那种高级的奶油肌妆效，完全不卡粉不浮粉，持妆12小时不是梦！重点是氧化程度几乎为零，带妆一整天还是白白净净的✨\n\n我买的是PO-01色号，黄一白刚刚好，自然提亮不会假面。遮瑕力大概7成左右，日常通勤完全够用～', tags:['粉底液推荐','干皮底妆','持妆神器'], image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop' },
  { id: 2, platform:'xiaohongshu', product:'YSL小金条#21', title:'冷白皮天菜！YSL小金条21试色分享💄', preview:'等了半个月终于到手的小金条21号！冷调复古红真的太绝了…', content:'等了半个月终于到手的小金条21号！冷调复古红真的太绝了💄\n\n薄涂是那种很气质的水红色，厚涂就是气场女王的蓝调正红。质地哑而不干，丝缎一样的质感太高级了～\n\n最关键的是这颜色巨显白，不管你是黄皮白皮都hold住！一年四季都能涂的颜色，预算够的姐妹直接冲🏃‍♀️', tags:['口红试色','显白口红','YSL'], image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400&h=400&fit=crop' },
  { id: 3, platform:'xiaohongshu', product:'珀莱雅双抗精华', title:'熬夜党续命神器！双抗精华真实测评', preview:'跟风入了这款被吹爆的双抗精华，用了两个月来交作业📝', content:'跟风入了这款被吹爆的双抗精华，用了两个月来交作业📝\n\n先说我肤质：混油皮+容易暗沉。用了一周就明显感觉早上起来脸没那么黄了，两周后同事问我是不是换粉底了哈哈～\n\n质地是淡橘色的精华液，流动性很强，上脸秒吸收不黏腻。味道是淡淡的橙子香，使用感满分！而且不到两百块，学生党也完全无压力💰', tags:['双抗精华','熬夜护肤','平价好物'], image: 'https://images.unsplash.com/photo-1570194065650-d99fb4ee8b03?w=400&h=400&fit=crop' },
  { id: 4, platform:'pengyouquan', product:'MAC Chili口红', title:'跟风入了MAC Chili，确实好看', preview:'好久没买新口红了，被同事种草了Chili。', content:'好久没买新口红了，被同事种草了Chili。\n\n颜色是真的显白，黄皮也能hold住。哑光质地不干，涂之前打个底就很好。日常薄涂就很提气色。\n\n推荐给想换口红色号的姐妹～', tags:['MAC','口红','好物分享'], image: 'https://images.unsplash.com/photo-1631214524020-7e18db9a8f92?w=400&h=400&fit=crop' },
  { id: 5, platform:'pengyouquan', product:'周末咖啡馆', title:'发现一个宝藏角落☕', preview:'周六下午误打误撞进了一家藏在巷子里的咖啡馆。', content:'周六下午误打误撞进了一家藏在巷子里的咖啡馆。\n\n手冲咖啡是老板自己烘焙的豆子，喝得出来很用心。阳光从老窗子洒进来，安安静静的，坐了一下午都不想走。\n\n地址在中山路老城区，感兴趣的私我～', tags:['咖啡馆','周末','探店'], image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=400&fit=crop' },
  { id: 6, platform:'pengyouquan', product:'新入机械键盘', title:'终于换了心心念念的键盘⌨️', preview:'打字手感真的好太多了，青轴的声音听着就很舒服。', content:'终于换了心心念念的键盘⌨️\n\n打字手感真的好太多了，青轴的声音听着就很舒服。虽然吵了点但就是喜欢这种机械感哈哈哈。\n\n颜值也在线，RGB灯效晚上超好看。程序员快乐小玩具～', tags:['机械键盘','数码','好物'], image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=400&fit=crop' },
  { id: 7, platform:'weibo', product:'玻尿酸面膜', title:'#好物分享# 这个面膜补水到天灵盖了💧', preview:'干敏皮换季救命神器！膜布超薄超服帖，精华液多到可以涂全身…', content:'#好物分享# 这个面膜真的补水到天灵盖了💧\n\n干敏皮换季救命神器！膜布超薄超服帖，精华液多到可以涂全身。敷完第二天脸嫩到忍不住一直摸，上妆完全不起皮。\n\n重点是价格太香了，一片不到五块钱，天天敷不心疼！#护肤推荐# #平价面膜#', tags:['好物分享','面膜','护肤'], image: 'https://images.unsplash.com/photo-1576426863848-c21f53c60b19?w=400&h=400&fit=crop' },
  { id: 8, platform:'weibo', product:'国货眉笔', title:'#美妆测评# 十块钱的国货眉笔赢了植村秀？', preview:'盲测了三款眉笔，结果出乎意料。国货这支显色度、顺滑度都不输大牌…', content:'#美妆测评# 十块钱的国货眉笔居然赢了植村秀？\n\n盲测了三款眉笔，结果出乎意料。国货这支显色度、顺滑度都不输大牌，而且一整天不晕不脱。\n\n关键是十块钱！用完可以直接扔不心疼。#平价好物# #眉笔推荐#', tags:['美妆测评','国货','眉笔'], image: 'https://images.unsplash.com/photo-1597225244660-1cd128c64284?w=400&h=400&fit=crop' },
  { id: 9, platform:'weibo', product:'小米手环8', title:'#数码开箱# 两百块的智能手环，香爆了⌚', preview:'小米手环8用了半个月，总结：该有的都有，不该有的也没有。', content:'#数码开箱# 两百块的智能手环，香爆了⌚\n\n小米手环8用了半个月，总结：该有的都有，不该有的也没有。\n\n心率、血氧、睡眠监测都挺准的，续航差不多两周。表盘选择多到用不完，NFC公交门禁全搞定。\n\n想买智能手表但预算有限的，先入这个，绝对不会后悔。#智能穿戴# #小米#', tags:['数码开箱','智能手环','小米'], image: 'https://images.unsplash.com/photo-1557438159-51eec7a6c9e8?w=400&h=400&fit=crop' },
  { id:10, platform:'douyin', product:'珀莱雅双抗精华', title:'熬夜党听好了！这个精华你必须知道⚡️', preview:'你敢信吗？用了两周脸直接亮了一个度！', content:'你敢信吗？用了两周脸直接亮了一个度！\n\n珀莱雅双抗精华，不到两百块，效果吊打大牌！质地超清爽，油皮也完全没负担。\n\n熬夜党、暗沉肌、学生党——闭眼入！下单链接在主页！', tags:['精华推荐','熬夜护肤','学生党'], image: 'https://images.unsplash.com/photo-1570194065650-d99fb4ee8b03?w=400&h=400&fit=crop' },
  { id:11, platform:'douyin', product:'懒人早餐神器', title:'三分钟搞定早餐！这个锅我用了半年', preview:'打工人必备！一个锅搞定煎蛋+烤面包+煮粥！', content:'打工人必备！一个锅搞定煎蛋+烤面包+煮粥！\n\n不粘涂层真的绝，不放油都不粘。每天三分钟搞定早餐，比外卖便宜十倍。半年了还跟新的一样。\n\n链接我放评论区了，两位数到手！#打工人早餐 #厨房好物', tags:['早餐','打工人','厨房好物'], image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop' },
  { id:12, platform:'douyin', product:'防晒霜推荐', title:'全网最全！10款防晒真人测评☀️', preview:'夏天来了！暴晒实测告诉你哪款真的晒不黑！', content:'夏天来了！暴晒实测告诉你哪款真的晒不黑☀️\n\n花了三个月测了10款防晒，就这三款值得买！清爽不油腻、不搓泥、不假白！\n\n重点看第三款，便宜又好用，学生党直接锁死！#防晒 #夏日必备', tags:['防晒','测评','夏日'], image: 'https://images.unsplash.com/photo-1559182795-e1678e1ae506?w=400&h=400&fit=crop' }
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function enrichCard(c) {
  const plat = PLATFORMS.find(p => p.key === c.platform) || PLATFORMS[0];
  const cover = getCover(c.product);
  return { ...c, platformName: plat.name, platformIcon: plat.icon, platformColor: plat.color, platformBg: plat.bg, coverEmoji: cover.emoji, coverGradient: cover.gradient, image: c.image || '' };
}

Page({
  data: {
    platforms: PLATFORMS,
    activeFilter: '',
    dailyPick: null,
    sections: [],
    allCards: [],
    activeCard: null,
    // 热榜
    trending: [],          // [{rank, title, hot}]
    trendingSource: '',    // 数据来源标签
    // 图片加载状态（key=cardId, value='loading'|'loaded'|'error'）
    imgState: {}
  },

  onLoad() {
    this._build();
    this._fetchTrending();
  },

  onShow() {
    this._build();
    this._fetchTrending();
  },

  _build() {
    const allCards = ALL_CARDS.map(enrichCard);

    const dayIdx = new Date().getDate() % allCards.length;
    const dailyPick = allCards[dayIdx];

    const sections = PLATFORMS.map(plat => ({
      key: plat.key,
      title: plat.icon + ' ' + plat.name + '精选',
      cards: shuffle(allCards.filter(c => c.platform === plat.key)).slice(0, 4)
    }));

    // 热榜初始值（兜底，等 _fetchTrending 覆盖）
    const fallbackTrending = [
      { rank: 1, title: '兰蔻持妆粉底液测评', hot: '128万' },
      { rank: 2, title: 'YSL小金条试色', hot: '96万' },
      { rank: 3, title: '珀莱雅双抗精华', hot: '85万' },
    ];

    this.setData({ dailyPick, sections, allCards, activeFilter: '', trending: fallbackTrending, trendingSource: '精选推荐' });
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
    } catch (_) {
      // 保持兜底数据
    }
  },

  onRefresh() {
    wx.vibrateShort({ type: 'light' });
    this._build();
    this._fetchTrending();
    wx.showToast({ title: '已刷新', icon: 'success', duration: 800 });
  },

  onFilter(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ activeFilter: key });
  },

  _getFilteredSections() {
    const filter = this.data.activeFilter;
    if (!filter) return this.data.sections;
    return this.data.sections.filter(s => s.key === filter);
  },

  onCardTap(e) {
    const card = e.currentTarget.dataset.card;
    this.setData({ activeCard: card });
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

  // 图片加载成功
  onImgLoad(e) {
    const id = e.currentTarget.dataset.id;
    const state = { ...this.data.imgState, [id]: 'loaded' };
    this.setData({ imgState: state });
  },

  // 图片加载失败 → 显示 emoji 兜底
  onImgError(e) {
    const id = e.currentTarget.dataset.id;
    const state = { ...this.data.imgState, [id]: 'error' };
    this.setData({ imgState: state });
  }
});