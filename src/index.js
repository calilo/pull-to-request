/**
 * Created by sunz on 2017/1/18.
 */
import AndroidPullPolyfill from './android-pull-polyfill';
import md from './utils/mobile-detect';
import $ from './utils/dom-helper';
import './main.scss';

export default class PullToRequest {
  static platform = md.isAndroid? 'android': md.isIOS? 'ios': 'others'
  static registed = []
  static states = {
    Initial: 0,
    Pulling: 1,
    Refreshing: 2,
    Refreshed: 3
  }
  getPtrContent(fromState, toState) {
    if (toState == PullToRequest.states.Pulling) {
      return 'Pulling';
    } else if (toState == PullToRequest.states.Refreshing) {
      return `<div class="spin-icon-loading"></div><div class="ptr-text">Refreshing</div>`;
    } else if (toState == PullToRequest.states.Refreshed) {
      return 'Refreshed';
    }
  }
  dispose() {
    if (!this.disposable) {
      return;
    }
    if (PullToRequest.platform == 'ios') {
      this.el.removeEventListener('scroll', this.handlePullIOS, true);
    } else {
      this.android_pull && this.android_pull.dispose();
    }
    this._removePtrContent();
    PullToRequest.registed = PullToRequest.registed.filter(e=>e!=this.el);
  }
  _removePtrContent() {
    this.ptrContainer.innerHTML = '';
  }
  _createPtrContent(style, innerEl) {
    let contentEl = $.createElement({className: 'ptr-content', style: `background-color: ${this.bgc}`, tag: 'div'});
    innerEl && contentEl.append(innerEl);
    return contentEl;
  }
  onStateChanged(fromState, toState) {
    this._removePtrContent();
    if (toState == PullToRequest.states.Initial) {
      return;
    }
    let innerHtml = this.getPtrContent(fromState, toState);
    let contentEl = `<div class="ptr-content" style="background-color: ${this.bgc}">${innerHtml}</div>`;
    //put the ptr-content on top of the ptr-container
    this.ptrContainer.innerHTML = contentEl;
  }
  handlePullIOS(e) {
    let getTop = this.el == document? (() => window.pageYOffset): (() => this.el.scrollTop);
    this.handlePullCommon(getTop);
  }
  handlePullAndroid(yoffset) {
    let getTop = () => yoffset;
    this.handlePullCommon(getTop);
  }
  handlePullCommon(getTopDelegate) {
    if (this.state == PullToRequest.states.Refreshed) {
      //1. state refreshed -- action:release pulling -> state becomes initial -- action:keep pulling -> keep state unchanged
      if (getTopDelegate() >= 0) {
        this.state = PullToRequest.states.Initial;
        this.onStateChanged(PullToRequest.states.Refreshed, PullToRequest.states.Initial);
      }
      return;
    } else if (this.state == PullToRequest.states.Initial) {
      //2. state initial -- action:start pulling -> branch 1(when top < pulloffset: state becomes refreshing; when top > pulloffset: state becomes pulling) -- action: do nothing or scroll down -> keep state unchanged
      let top = getTopDelegate();
      if (top <0 && top >= this.pulloffset) {
        this.state = PullToRequest.states.Pulling;
        this.onStateChanged(PullToRequest.states.Initial, PullToRequest.states.Pulling);
      } else if (top < this.pulloffset) {
        this.state = PullToRequest.states.Refreshing;
        this.onStateChanged(PullToRequest.states.Initial, PullToRequest.states.Refreshing);
      }
      return;
    } else if (this.state == PullToRequest.states.Pulling) {
      //3. state pulling -- action:pull down to refresh(top<pulloffset) -> state becomes refreshing -- action:keep pulling(0>top>=pulloffset) -> keep state unchanged -- action:release pulling(top>=0) -> state becomes initial
      let top = getTopDelegate();
      if (top < this.pulloffset) {
        this.state = PullToRequest.states.Refreshing;
        this.onStateChanged(PullToRequest.states.Pulling, PullToRequest.states.Refreshing);
      } else if (top >= 0) {
        this.state = PullToRequest.states.Initial;
        this.onStateChanged(PullToRequest.states.Pulling, PullToRequest.states.Initial);
      }
      return;
    } else if (this.state == PullToRequest.states.Refreshing) {
      //4. state refreshing -> doesn't depend on user action, but fetch request finished. -- only if timeout exceeded, the fetch would be aborted.
      let top = getTopDelegate();
      setTimeout(function () {
        //TODO: abort fetch action
        this.state = PullToRequest.states.Initial;
        this.onStateChanged(PullToRequest.states.Refreshing, PullToRequest.states.Initial);
      }.bind(this), 3000);
      return;
    }
  }
  constructor({el = document, pulloffset = -30, ptrContainer, bgc = 'inherit'}) {
    if (!ptrContainer) {
      console.error("ptrContainer should be specified!");
      return;
    }
    this.el = el;
    this.pulloffset = pulloffset;
    this.ptrContainer = ptrContainer;
    this.bgc = bgc;
    if(PullToRequest.registed.some(item=>item == this.el)) {
      return;
    }
    this.state = PullToRequest.states.Initial;
    this.disposable = true;
    if (PullToRequest.platform == 'ios') {
      this.el.addEventListener('scroll', this.handlePullIOS.bind(this), true);
    } else {
      this.android_pull = new AndroidPullPolyfill({
        el: this.el,
        scrollCallback: this.handlePullAndroid.bind(this)
      })
    }
  }
  disposable: false

}