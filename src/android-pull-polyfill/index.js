import './_all.scss';

export default class AndroidPullPolyfill {
  static registed = []
  dispose() {
    if (!this.disposable) {
      return;
    }
    this.el.removeEventListener("touchstart", this.handleStart, true);
    this.el.removeEventListener("touchend", this.handleEnd, true);
    this.el.removeEventListener("touchcancel", this.handleCancel, true);
    this.el.removeEventListener("touchmove", this.handleMove, true);
    AndroidPullPolyfill.registed = AndroidPullPolyfill.registed.filter(e=>e!=this.el);
  }
  handleStart(e) {
    if (this.exeDeferQueue.length > 0) {
      this.exeDeferQueue.push(function () {
        this.pan.startingPositionY = this.getTop();
        this.pan.touchStartingPositionY = e.touches[0].pageY;
        this.pan.yoffset = this.pan.startingPositionY;
        this.pan.pullStarted = false;
      }.bind(this));
    } else {
      this.pan.startingPositionY = this.getTop();
      this.pan.touchStartingPositionY = e.touches[0].pageY;
      this.pan.yoffset = this.pan.startingPositionY;
      this.pan.pullStarted = false;
    }
  }
  handleEnd(e) {
    this._touchFinish();
  }
  handleCancel(e) {
    this._touchFinish();
  }
  exeDeferQueue = []
  _touchFinish() {
    if (!this.pan.pullStarted) {
      return;
    }
    let yoffset = this.yoffset;
    this.exeDeferQueue.push(function virtualSliding() {
      console.log(`yoffset: ${yoffset} ---------!`);
      yoffset += 3;
      if (yoffset < 0) {
        this.scrollCallback(yoffset);
        this.exeDeferQueue.push(virtualSliding.bind(this));
      } else {
        this.scrollCallback(0);
      }
    }.bind(this))
    setTimeout(function consumeQueue() {
      let shifted = this.exeDeferQueue.shift();
      if (shifted) {
        shifted();
        setTimeout(consumeQueue.bind(this), 20);
      }
    }.bind(this), 20);
  }
  handleMove(e) {
    let distance = e.touches[0].pageY - this.pan.touchStartingPositionY;
    let yoffset = this.pan.startingPositionY - distance;
    this.yoffset = yoffset;
    if (yoffset <= 0) {
      this.scrollCallback(yoffset);
      this.pan.pullStarted = true;
    }
  }
  disposable: false
  constructor({el=document, scrollCallback=(yoffset)=>{}}) {
    this.el = el;
    this.scrollCallback = scrollCallback;
    this.pan = {
      pullStarted: false,
      startingPositionY: 0,
      touchStartingPositionY: 0
    }
    if(AndroidPullPolyfill.registed.some(item=>item == this.el)) {
      return;
    }
    this.getTop = el == document? (() => window.pageYOffset): (() => this.el.scrollTop);
    this.disposable = true;
    this.el.addEventListener("touchstart", this.handleStart.bind(this), true);
    this.el.addEventListener("touchend", this.handleEnd.bind(this), true);
    this.el.addEventListener("touchcancel", this.handleCancel.bind(this), true);
    this.el.addEventListener("touchmove", this.handleMove.bind(this), true);
    AndroidPullPolyfill.registed.push(this.el);
  }
}