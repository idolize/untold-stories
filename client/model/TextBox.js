var $ = require('jquery');
var uuid = require('uuid');
var easeljs = require('easeljs');

// TODO Decouple the DOM from this class somehow?
// Maybe pass in a factory object
function constructTextbox(text, isAction, id) {
  var element = $('<p />', {
    'class': 'textbox' + (isAction? ' action' : ''),
    text: text,
    draggable: false,
    id: id
  });
  element.contents().attr('draggable', false);
  element.appendTo('#textcontainer');
  return element;
}

function TextBox(text, x, y, isAction, id) {
  this.text = text;
  this.id = id || uuid.v4();
  this.domNode = constructTextbox(text, isAction, id);
  this.pos = {};
  this.isAction = isAction || false;
  this.setPos(x, y);

  this._dragStartFunc = function (e) {
    var event = e.originalEvent;
    var objStr = JSON.stringify({
        offset: {
            x: (parseInt(this.domNode.css('left'), 10) - event.clientX),
            y: (parseInt(this.domNode.css('top'), 10) - event.clientY)
        },
        id: this.id,
        isAction: this.isAction
    });
    event.dataTransfer.setData('text/plain', objStr);
  }.bind(this);
}

TextBox.prototype.setPos = function(x, y) {
  this.pos.x = x;
  this.pos.y = y;
  this.domNode.css({
    left: x + 'px',
    top: y + 'px'
  });
};

TextBox.prototype.setDraggable = function(isDraggable) {
  if (isDraggable) this.domNode.on('dragstart', this._dragStartFunc);
  else this.domNode.off('dragstart', this._dragStartFunc);
  this.domNode.attr('draggable', isDraggable);
};

TextBox.prototype.destroy = function() {
  this.domNode.off();
  this.domNode.remove();
};

TextBox.prototype.toJSON = function() {
  return { text: this.text, pos: this.pos, isAction: this.isAction, id: this.id };
};

TextBox.fromJSON = function(jsonObj) {
  return new TextBox(jsonObj.text, jsonObj.pos.x, jsonObj.pos.y, jsonObj.isAction, jsonObj.id );
};

module.exports = TextBox;