var util = require('util');
var events = require('events');

// TODO convert to jQuery
function ImageButton(type, isTile) {
  this.type = type;

  this._clickedFunc = function(event) {
    this.emit('click', event);
  }.bind(this);

  // Note: Chrome seems to re-request the image every time the tab changes when using
  // <input type="image"> so we must use an img tag instead to avoid this. This makes
  // enabling/disabiling the button more compilcated, however, as we must manually
  // style the button and disable/enable listeners.
  this.element = new Element('img', { src: type.image.src }); // copy the image
  this.element.addClass('imgBtn');
  this.element.addClass('object');
  this.setEnabled(true);
}
util.inherits(ImageButton, events.EventEmitter);
module.exports = ImageButton;

ImageButton.prototype.setEnabled = function(enabled) {
  if (enabled) {
    this.element.removeClass('disabled');
    this.element.addEvent('click', this._clickedFunc);
    this.tooltip = new mBox.Tooltip({
      content: ('"'+this.type.id+'"'),
      theme: 'Black',
      attach: this.element
    });
  } else {
    this.element.addClass('disabled');
    this.element.removeEvent('click', this._clickedFunc);
    this.tooltip.destroy();
    this.element.removeEvents('mouseenter');
  }
};

ImageButton.prototype.destroy = function() {
  this.element.removeEvents();
  this.element.destroy();
  this.tooltip.destroy();
};

ImageButton.prototype.toElement = function() {
  return this.element;
};