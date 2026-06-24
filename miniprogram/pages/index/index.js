const app = getApp();

Page({
  data: {
    prompt: '',
    loading: false,
    result: null,
    error: ''
  },

  onInput(e) {
    this.setData({ prompt: e.detail.value, error: '' });
  },

  onGenerate() {
    const prompt = this.data.prompt.trim();
    if (!prompt) {
      this.setData({ error: '请输入产品名称或主题' });
      return;
    }

    this.setData({ loading: true, result: null, error: '' });

    wx.request({
      url: app.globalData.apiUrl,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: { prompt },
      success: (res) => {
        const data = res.data;
        if (data && data.success && data.titles) {
          this.setData({ result: data, loading: false });
        } else {
          this.setData({
            error: (data && data.error) || '生成失败，请重试',
            loading: false
          });
        }
      },
      fail: (err) => {
        this.setData({
          error: '网络请求失败: ' + (err.errMsg || '未知错误'),
          loading: false
        });
      }
    });
  },

  onCopy(e) {
    wx.setClipboardData({
      data: e.currentTarget.dataset.text,
      success() { wx.showToast({ title: '已复制', icon: 'success' }); }
    });
  }
});