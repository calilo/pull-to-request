import PullToRequest from '../src/index';

window.onload = function () {
  let aa = new PullToRequest({
    // el: document.getElementById('app'),
    ptrContainer:document.getElementsByClassName('ptr-container')[0],
    bgc: 'red'
  });
}