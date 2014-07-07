var util = require('util');
var events = require('events');

// TODO convert to jQuery
function TextboxPrompt(target) {
  var that = this;
  var content = new Element('div', {
    style: { width: '213px'}
  });
  var textbox = new Element('textarea', {
    style: { width: '200px', 'margin-top': '5px' },
    cols: 30,
    rows: 3
  });
  textbox.inject(content);

  this.modal = new mBox.Modal({
    content: content,
    title: 'Enter your text',
    closeOnBodyClick: false,
    position: { x: ['left', 'inside'], y: ['top', 'inside'] },
    fade: false,
    onOpen: function() {
      // change title
      this.setTitle(that.isAction ? 'Enter your action' : 'Enter your dialog');
      // position at the cursor
      this.setPosition(target, this.options.position, { x: that.pos.x, y: that.pos.y });
      setTimeout(function() { textbox.focus(); }, 10); // focus the textarea
    },
    onClose: function() {
      that.removeListener('added', that.callback);
    },
    buttons: [
      { title: 'Cancel' },
      {
        title: 'Add',
        addClass: 'button_green',
        event: function() {
          var text = textbox.get('value');
          textbox.set('value', '');
          that.emit('added', text);
          this.close();
        }
      }
    ]
  });
}
util.inherits(TextboxPrompt, events.EventEmitter);
module.exports = TextboxPrompt;

TextboxPrompt.prototype.openPrompt = function(pos, isAction, callback) {
  this.pos = pos;
  this.isAction = isAction;
  this.callback = callback;

  this.once('added', this.callback);
  this.modal.open();
};