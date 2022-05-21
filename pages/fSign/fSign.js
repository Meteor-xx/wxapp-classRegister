// pages/fSign/fSign.js
var timeUtil = require("../../utils/util");
var app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    time:timeUtil.timeData,
    index:0,
    cid:'',
  },

  //选择时间
  pickerChange:function(e){
    this.setData({
      index:e.detail.value,
    })
  },
  //创建签到
  createSign:function(e){
    wx.showToast({
      title: '创建成功',
    })
    //返回首页
    setTimeout(function(){
      wx.reLaunch({
        url: '../index/index',
      })
    },2000);
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.data.cid = options.cid;
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})