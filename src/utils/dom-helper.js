function createElement({tag = 'div', className = '', style = ''}) {
  let el = document.createElement('div');
  el.setAttribute('class', className);
  el.setAttribute('style', style);
  return el;
}

function updateStyle({el, className, style}) {
  if (!el || (!className && !style)) {
    return;
  }
  el.setAttribute('class', className);
  el.setAttribute('style', style);
}

function findElementByClass({parent = document.body, className}) {
  for (let children = parent.children, c_size = children.length, i=0; i<c_size; ++i) {
    let c = children[i];
    if (c.getAttribute('class').indexOf(className) !== -1) {
      return c;
    }
  }
}

function prependElement({parent = document.body, el}) {
  if (!el) {
    return;
  }
  if (parent.firstChild) {
    parent.insertBefore(el, parent.firstChild);
  } else {
    parent.append(el);
  }
}

export default {
  createElement,
  updateStyle,
  findElementByClass,
  prependElement
}