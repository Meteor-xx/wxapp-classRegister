const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    countDownNum: 5, // 录制视频时间
    msgStatus: 0, // 识别状态，0为未识别或识别中，1为识别成功，-1为识别失败
    i: '',
    recordNum: 2, // 记录识别次数
    showCamera: false, // 是否显示相机
    recordStatus: 0 // 录制状态，0为未开始录制， 1为开始录制，2为结束录制
  },

  onLoad() {
    this.getAuthorize('scope.camera', 1)
  },
  getAuthorize: function(value, num) { // 判断是否授权摄像头和录音，num表示判断的序号，1为摄像头，2为录音
    let _this = this
    wx.getSetting({
      success: res => {
        console.log(res.authSetting)
        if (res.authSetting[value] != true) {
          wx.authorize({
            scope: value,
            success () {
              _this.successNext(num)
            }, fail() {
              console.log('未授权');
              wx.showModal({
                title: '开启' + (num == 1 ? '摄像机' : '录音') + '失败',
                showCancel: false,
                content: '点击确定重试!',
                success: function (res) {
                  if (res.confirm) {
                    _this.openSetting(value, num)
                  }
                }
              });
            }
          })
        } else { // 权限开启成功
          _this.successNext(num)
        }
      }
    })
  },
  openSetting: function(value, num) { // 打开设置页
    var _this =this;
    wx.openSetting({
      success(res) {
        if (res.authSetting[value] != true){
          wx.showModal({
            title: '开启' + (num == 1 ? '摄像机' : '录音') + '失败',
            showCancel: false,
            content: '点击确定重试!',
            success: function (res) {
              if (res.confirm) {
                _this.openSetting(value, num)
              }
            }
          });
        } else {
          _this.successNext(num)
        }
      }, fail(res) {
        console.log(res)
      }
    })
  },
  successNext: function(num) {
    if (num == 1) { // 摄像头权限获取成功，去获取录音权限
      this.getAuthorize('scope.record', 2)
    } else if (num == 2) { // 录音权限获取成功，开始录像
      this.openCamera();
      console.log('已授权');
    }
  },
  openCamera: function() { // 打开相机
    this.setData({
      showCamera: true
    })
    this.ctx = wx.createCameraContext();
    this.countDown();
  },

  countDown: function (e) { // 视频录制三秒
    let that = this;
    let countDownNum = 5; // 获取倒计时初始值
    let i = this.data.i;
    if (!i) {
      i = 2
    }
    that.data.recordNum++;
    that.setData({
      recordStatus: 1,
      timer: setInterval(function () {
        if (countDownNum == 5) {
          that.startRecord(); // 开始录制
        }
        countDownNum--;
        that.setData({
          countDownNum: countDownNum,
          i: i
        })
        if (countDownNum == 0) {
          clearInterval(that.data.timer); // 清空定时器
          that.stopRecord(); // 结束录制
        }
      }, 1000)
    })
  },


  startRecord() { // 开始录制
    var _this = this;
    _this.ctx.startRecord({
      success: (res) => {
        console.log('录像开始')
      },fail(res){
        console.log('录像未开始')
      }
    })
  },
  stopRecord() {
    var that = this;
    console.log('停止录像');
    that.ctx.stopRecord({
      success: (res) => {
        that.setData({
          recordStatus: 2
        })
        that.uploadFile(res)
      },fail(res){
        console.log(res);
        that.judgeStatus()
      }
    })
  },
  judgeStatus: function() { // 失败时判断是否继续识别
    var that = this;
    if (that.data.recordNum < 3 && that.data.msgStatus != 1) {
      setTimeout(function () {
        that.setData({
          countDownNum: 5
        })
        that.countDown();
      }, 1000)
    } else if (that.data.recordNum == 3 && that.data.msgStatus != 1) {
      that.setData({
        countDownNum: 5,
        msgStatus: -1
      })
    }
    //返回首页
    setTimeout(function(){
      wx.reLaunch({
        url: '../../index/index',
      })
    },2000);
  },

  uploadFile: function(file) { // 上传视频
    var that = this;
    wx.showLoading({
      title: '视频上传中',
    })
    wx.uploadFile({
      url: app.globalData.url+'/fsign',
      filePath: file.tempThumbPath,
      name: 'img', // 上传的视频字段名
      success: function (res) {
        console.log(res);
        wx.hideLoading()
        if (res.code == '00000') { // 上传成功
          that.identify(res.data.img)
        } else {
          that.judgeStatus()
        }
      }, fail(res) {
        wx.hideLoading()
        wx.showToast({
          title: '视频上传失败',
        })
        that.judgeStatus()
      }
    })
  },

  identify: function(img) { // 请求后端人脸识别接口
    wx.showLoading({
      title: '正在识别',
    })
    wx.request({
      url: app.globalData.url+'/fsign', // 判断是否有人脸
      data: {
        image: img
      },
      method: "POST",
      success: function (res) {
         console.log(res)
        if (res.data.code == '00000') {
          console.log('人脸识别成功');
          var image_url = res.data.data.image_url;
          wx.request({
            url: app.globalData.url+'/fsign', // 实人认证
            data: {
              image_url: res.data.data.image_url
            },
            method: "POST",
            success: function (res) {
              console.log('实人认证成功');
              wx.hideLoading();
              if (res.data.code == '00000') {
                that.setData({
                  msgStatus: 1
                })
                // 实人认证成功后的操作
              } else {
                wx.hideLoading();
                console.log('实人认证失败');
                that.judgeStatus()
              }
            }
          })
        } else {
          console.log('人脸识别失败' + that.data.recordNum);
          wx.hideLoading();
          that.judgeStatus()
        }
      }
    })
  },

  // 重新扫描
  rescan: function () {
    this.onLoad();
    this.setData({
      msgStatus: 0,
      recordNum: 0,
      recordStatus: 0
    })
  },

  onUnload: function () {
    var that = this;
    clearInterval(that.data.timer);
  },
})
