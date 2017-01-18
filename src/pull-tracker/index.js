import './_all.scss';

export default class PullTracker {
  static registed = []
  dispose() {
    if (!this.disposable) {
      return;
    }
    this.el.removeEventListener("touchstart", this.handleStart, true);
    this.el.removeEventListener("touchend", this.handleEnd, true);
    this.el.removeEventListener("touchcancel", this.handleCancel, true);
    this.el.removeEventListener("touchmove", this.handleMove, true);
    PullTracker.registed = PullTracker.registed.filter(e=>e!=this.el);
  }
  handleStart(e) {
    this._disableChromePtr("start", window.pageYOffset, e);
    if (this.muted) {
      this.pan.mutedStart = true;
      return;
    } else {
      this.pan.mutedStart = false;
    }
    if (this.exeDeferQueue.length > 0) {
      this.exeDeferQueue = [];
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
  handleMove(e) {
    this._disableChromePtr("move", 0, e);
    if (this.pan.mutedStart) {
      return;
    }
    let distance = e.touches[0].pageY - this.pan.touchStartingPositionY;
    let yoffset = this.pan.startingPositionY - distance;
    this.yoffset = yoffset;
    if (yoffset <= 0) {
      this.scrollCallback(yoffset);
      this.pan.pullStarted = true;
    }
  }
  _disableChromePtr(touchState, yoffset, e) {
    if (touchState == "start" && yoffset <= 0) {
      this._disableChromePtr.state = "started";
    } else if (touchState == "move" && this._disableChromePtr.state == "started") {
      e.preventDefault();
    }
  }
  exeDeferQueue = []
  _between(v, leftInc, rightExc) {
    if (leftInc <= v && v <rightExc || leftInc >= v && v > rightExc) {
      return true;
    }
    return false;
  }
  _touchFinish() {
    if (this.pan.mutedStart) {
      return;
    }
    if (!this.pan.pullStarted) {
      return;
    }
    let yoffset = this.yoffset;
    let initYoffset = yoffset;
    this.releaseCallback(yoffset);
    let target = this.muted? this.pulloffset: 0;
    let step = (target - initYoffset) * 20 / 200;
    this.exeDeferQueue.push(function virtualSliding() {
      yoffset += step;
      if (this._between(yoffset, initYoffset, target)) {
        this.scrollCallback(yoffset);
        this.exeDeferQueue.push(virtualSliding.bind(this));
      } else {
        this.scrollCallback(target);
        this.muted && this.startRefreshCallback();
      }
    }.bind(this));
    this._exeAsync();
  }
  _exeAsync() {
    setTimeout(function consumeQueue() {
      let shifted = this.exeDeferQueue.shift();
      if (shifted) {
        shifted();
        setTimeout(consumeQueue.bind(this), 20);
      }
    }.bind(this), 20);
  }
  onRefreshed() {
    let yoffset = this.pulloffset;
    let initYoffset = yoffset;
    let target = 0;
    let step = (target - initYoffset) * 20 / 200;
    let executing = this.exeDeferQueue.length > 0;
    this.exeDeferQueue = [];
    this.exeDeferQueue.push(function virtualSliding() {
      yoffset += step;
      if (this._between(yoffset, initYoffset, target)) {
        this.scrollCallback(yoffset);
        this.exeDeferQueue.push(virtualSliding.bind(this));
      } else {
        this.scrollCallback(target);
        this.muted && this.startRefreshCallback();
      }
    }.bind(this));
    if (!executing) {
      this._exeAsync();
    }
  }
  disposable: false
  setMute(muted) {
    this.muted = muted;
  }
  constructor({el=document, scrollCallback=(yoffset)=>{}, releaseCallback=(yoffset)=>{}, startRefreshCallback=()=>{}, pulloffset=-30}) {
    this.muted = false;
    this.el = el;
    this.pulloffset = pulloffset;
    this.scrollCallback = scrollCallback;
    this.releaseCallback = releaseCallback;
    this.startRefreshCallback = startRefreshCallback;
    this.pan = {
      pullStarted: false,
      startingPositionY: 0,
      touchStartingPositionY: 0,
      yoffset: 0,
      mutedStart: false
    }
    if(PullTracker.registed.some(item=>item == this.el)) {
      return;
    }
    this.getTop = el == document? (() => window.pageYOffset): (() => this.el.scrollTop);
    this.disposable = true;
    this.el.addEventListener("touchstart", this.handleStart.bind(this), true);
    this.el.addEventListener("touchend", this.handleEnd.bind(this), true);
    this.el.addEventListener("touchcancel", this.handleCancel.bind(this), true);
    this.el.addEventListener("touchmove", this.handleMove.bind(this), true);
    PullTracker.registed.push(this.el);
  }
}