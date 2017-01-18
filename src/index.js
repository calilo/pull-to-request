/**
 * Created by sunz on 2017/1/18.
 */
import PullTracker from './pull-tracker';
import './main.scss';

export default class PullToRequest {
  static registed = []
  static states = {
    Initial: 0,
    Pulling: 1,
    PreRefreshing: 2,
    Refreshing: 3,
    Refreshed: 4
  }
  getPtrContent(fromState, toState) {
    if (toState == PullToRequest.states.Pulling) {
      return `<svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="24.000000pt" height="24.000000pt" viewBox="0 0 128.000000 128.000000" preserveAspectRatio="xMidYMid meet">
    <circle cx="64" cy="64" r="64" fill="#4584f1"/>
    <g transform="translate(12.800000,115.200000) scale(0.080000,-0.080000)" fill="#ffffff" stroke="none">
      <path d="M998 1113 l-56 -56 -70 36 c-220 116 -462 79 -638 -97 -110 -110
        -156 -223 -156 -382 0 -242 159 -451 394 -519 68 -19 202 -22 273 -5 124 30
        258 125 325 230 46 72 79 170 87 256 l6 74 -92 0 -91 0 0 -33 c0 -58 -30 -151
        -65 -202 -44 -64 -93 -102 -169 -133 -80 -32 -205 -29 -281 8 -69 33 -136 99
        -170 166 -37 73 -46 195 -21 272 67 200 295 305 482 223 l47 -21 -57 -59 c-59
        -62 -69 -93 -37 -111 29 -15 374 -13 389 2 17 17 17 379 0 396 -22 22 -43 13
        -100 -45z"/>
    </g>
  </svg>`;
    } else if (toState == PullToRequest.states.Refreshing) {
      return `<div class="spin-icon-loading"></div><div class="ptr-text">Refreshing</div>`;
    } else if (toState == PullToRequest.states.Refreshed) {
      return `<div class="ptr-text">Refreshed</div>`;
    }
  }
  dispose() {
    if (!this.disposable) {
      return;
    }
    this.pullTracker && this.pullTracker.dispose();
    this._removePtrContent();
    PullToRequest.registed = PullToRequest.registed.filter(e=>e!=this.el);
  }
  _removePtrContent() {
    this.ptrContainer.innerHTML = '';
  }
  onStateChanged(fromState, toState) {
    if (fromState == PullToRequest.states.Refreshing) {
      this.pullTracker.setMute(false);
      this.pullTracker.onRefreshed();
    } else if (toState == PullToRequest.states.PreRefreshing) {
      this.pullTracker.setMute(true);
      return;
    }
    this._removePtrContent();
    if (toState == PullToRequest.states.Initial) {
      return;
    }
    let innerHtml = this.getPtrContent(fromState, toState);
    let bgcAttr = (toState == PullToRequest.states.Refreshing || toState == PullToRequest.states.Refreshed)? `background-color: ${this.bgc}; opacity: 0.6;`: '';
    let contentEl = `<div class="ptr-content" style="${bgcAttr}">${innerHtml}</div>`;
    //put the ptr-content on top of the ptr-container
    this.ptrContainer.innerHTML = contentEl;
  }
  handlePull(yoffset) {
    this.handleCommon({yoffset});
    if (this.state == PullToRequest.states.Pulling || this.state == PullToRequest.states.PreRefreshing) {
      let svgEl = this.ptrContainer.children[0].children[0];
      let sqrtVal = Math.sqrt(-yoffset);
      svgEl.setAttribute('style', `transform: translate(0,${sqrtVal}px) rotate(${-yoffset*0.5}deg); -webkit-transform: translate(0,${sqrtVal}px) rotate(${-yoffset*0.5}deg); opacity: ${0.003*yoffset+1};`);
    }
  }
  handleRelease(yoffset) {
    this.handleCommon({release:true, yoffset});
  }
  handleRefresh() {
    this.handleCommon({refresh:true});
  }
  handleCommon({yoffset, release=false, refresh=false}) {
    if (this.state == PullToRequest.states.Refreshed) {
      //1. state refreshed -- action:release pulling -> state becomes initial -- action:keep pulling -> keep state unchanged
      if (yoffset >= 0) {
        this.state = PullToRequest.states.Initial;
        this.onStateChanged(PullToRequest.states.Refreshed, PullToRequest.states.Initial);
      }
      return;
    } else if (this.state == PullToRequest.states.Initial) {
      //2. state initial -- action:start pulling -> branch 1(when top < pulloffset: state becomes refreshing; when top > pulloffset: state becomes pulling) -- action: do nothing or scroll down -> keep state unchanged
      if (yoffset <0 && yoffset >= this.pulloffset) {
        this.state = PullToRequest.states.Pulling;
        this.onStateChanged(PullToRequest.states.Initial, PullToRequest.states.Pulling);
      } else if (yoffset < this.pulloffset) {
        this.state = PullToRequest.states.PreRefreshing;
        this.onStateChanged(PullToRequest.states.Initial, PullToRequest.states.PreRefreshing);
      }
      return;
    } else if (this.state == PullToRequest.states.Pulling) {
      //3. state pulling -- action:pull down to refresh(top<pulloffset) -> state becomes refreshing -- action:keep pulling(0>top>=pulloffset) -> keep state unchanged -- action:release pulling(top>=0) -> state becomes initial
      if (yoffset < this.pulloffset && release) {
        this.state = PullToRequest.states.PreRefreshing;
        this.onStateChanged(PullToRequest.states.Pulling, PullToRequest.states.PreRefreshing);
      } else if (yoffset >= 0) {
        this.state = PullToRequest.states.Initial;
        this.onStateChanged(PullToRequest.states.Pulling, PullToRequest.states.Initial);
      }
      return;
    } else if (this.state == PullToRequest.states.PreRefreshing) {
      if (refresh) {
        this.state = PullToRequest.states.Refreshing;
        this.onStateChanged(PullToRequest.states.PreRefreshing, PullToRequest.states.Refreshing);
        this.handleCommon({yoffset, release, refresh});
      }
    } else if (this.state == PullToRequest.states.Refreshing) {
      //4. state refreshing -> doesn't depend on user action, but fetch request finished. -- only if timeout exceeded, the fetch would be aborted.
      let passed = false;
      let funcpass = function () {
        if (passed) {
          return;
        }
        this.state = PullToRequest.states.Refreshed;
        this.onStateChanged(PullToRequest.states.Refreshing, PullToRequest.states.Refreshed);
        passed = true;
      }.bind(this);
      setTimeout(funcpass, 3000);
      if (this.pTask != null) {
        this.pTask().then(funcpass).catch(funcpass);
      }
      return;
    }
  }
  constructor({el = document, pulloffset = -30, ptrContainer, bgc = '#f1f1f1', pTask}) {
    if (!ptrContainer) {
      console.error("ptrContainer should be specified!");
      return;
    }
    this.el = el;
    this.pulloffset = pulloffset;
    this.ptrContainer = ptrContainer;
    this.bgc = bgc;
    this.pTask = pTask;
    if(PullToRequest.registed.some(item=>item == this.el)) {
      return;
    }
    this.state = PullToRequest.states.Initial;
    this.disposable = true;
    this.pullTracker = new PullTracker({
      el: this.el,
      scrollCallback: this.handlePull.bind(this),
      releaseCallback: this.handleRelease.bind(this),
      startRefreshCallback: this.handleRefresh.bind(this),
      pulloffset
    });
  }
  disposable: false

}