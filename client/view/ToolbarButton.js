var util = require('util');
var events = require('events');

// TODO convert to jQuery
function ToolbarButton(toolname, tooltipText, promptText) {
  this.toolname = toolname;

  var clickedFunc = function(event) {
    this.emit('click', event);
  }.bind(this);

  if (promptText) {
    confirmBox = new mBox.Modal({
      content: promptText,
      addClass: {
        wrapper: 'Confirm'
      },
      position: {
        y: 'center',
        x: 'left'
      },
      onCloseComplete: function() {
        //this.destroy(); // <- keep it around but be sure to destroy it if the button is destroyed
      },
      buttons: [
        { title: 'No', addClass: 'mBoxConfirmButtonCancel' },
        { title: 'Yes', addClass: 'button_green mBoxConfirmButtonSubmit', event: function(ev) { clickedFunc(ev); this.close(); } }
      ]
    });
  }

  this.element = new Element('input', {
    type: 'image',
    'class': 'toolbarbtn',
    src: '../images/tools/'+ toolname +'.png',
    id: (toolname + 'ToolBtn'),
    events: { click: (promptText ? confirmBox.open.bind(confirmBox) : clickedFunc) }
  });

  this.tooltip = new mBox.Tooltip({
    content: tooltipText,
    theme: 'Black',
    attach: this.element
  });
}
util.inherits(ToolbarButton, events.EventEmitter);
module.exports = ToolbarButton;

ToolbarButton.prototype.setEnabled = function(enabled) {
  if (enabled) this.element.erase('disabled');
  else this.element.set('disabled', 'disabled');
};

ToolbarButton.prototype.destroy = function() {
  this.tooltip.destroy();
  this.element.removeEvents();
  this.element.destroy();
  if (this.confirmBox) this.confirmBox.destroy();
};