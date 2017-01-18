import PullToRequest from '../src/index';

window.onload = function () {
  let aa = new PullToRequest({
    // el: document.getElementById('app'),
    ptrContainer:document.getElementsByClassName('ptr-container')[0],
    pTask: ()=>new Promise(function (resolve, reject) {
      setTimeout(function () {
        resolve();
      }, 2000);
    })
  });
}