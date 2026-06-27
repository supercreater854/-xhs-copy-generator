Component({
  properties: {
    card: { type: Object, value: {} },
    index: { type: Number, value: 0 }
  },
  methods: {
    onCopyAll() {
      const c = this.properties.card;
      const text = (c.title || '') + '\n\n' + (c.content || '') + '\n\n' +
        (c.hashtags || []).map(t => '#' + t.replace(/^#/, '')).join(' ');
      wx.setClipboardData({ data: text, success() { wx.showToast({ title: '已复制', icon: 'success', duration: 1500 }); } });
    },
    onCopyField(e) {
      wx.setClipboardData({ data: e.currentTarget.dataset.text, success() { wx.showToast({ title: '已复制', icon: 'success', duration: 1200 }); } });
    },
    onAction(e) {
      const act = e.currentTarget.dataset.action;
      this.triggerEvent('action', { action: act, card: this.properties.card });
    }
  }
});