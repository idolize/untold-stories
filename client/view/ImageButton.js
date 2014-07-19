require('bootstrap');
var $ = require('jquery');
var jBox = require('jBox');
var util = require('util');
var events = require('events');

function ImageButton(type, isTile) {
  this.type = type;

  this._clickedFunc = function(event) {
    this.emit('click', event);
  }.bind(this);

  this.element = $('<div></div>', {
    css: {
      display: "inline-block",
      "min-width": "32px",
      "min-height": "32px"
    }
  });
  this.element.tooltip({
    title: ('"'+this.type.id+'"')
  });

  // Note: Chrome seems to re-request the image every time the tab changes when using
  // <input type="image"> so we must use an img tag instead to avoid this. This makes
  // enabling/disabiling the button more compilcated, however, as we must manually
  // style the button and disable/enable listeners.
  this.image = $('<img />', { src: type.image.src }); // copy the Image we have cached in 'type'
  this.image.addClass('imgBtn');
  this.image.addClass('object');

  this.element.append(this.image);

  this.setEnabled(true);
}
util.inherits(ImageButton, events.EventEmitter);
module.exports = ImageButton;

ImageButton.prototype.setEnabled = function(enabled) {
  if (enabled) {
    this.image.removeClass('disabled');
    this.image.on('click', this._clickedFunc);
  } else {
    this.image.addClass('disabled');
    this.image.off('click', this._clickedFunc);
    this.element.tooltip('hide');
    this.image.off('mouseenter');
  }
};

ImageButton.prototype.setSelected = function(isSelected) {
  this.image.toggleClass('selectedBtn', isSelected);
};

ImageButton.prototype.destroy = function() {
  this.element.empty();
  this.element.remove();
  this.element.tooltip('destroy');
};