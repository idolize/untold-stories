var easeljs = require('easeljs');

function TextBox(domNode, text, x, y, isAction) {
  this.text = text;
  this.pos = { x: x, y: y };
  this.domElement = new easeljs.DOMElement(domNode);
  this.domElement.x = x;
  this.domElement.y = y;
  this.isAction = isAction || false;
  this.domElement.htmlElement.style.display = 'block'; // begin rendering
}

module.exports = TextBox;