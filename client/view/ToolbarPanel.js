var util = require('util');
var events = require('events');
var ToolbarButton = require('./ToolbarButton');

// TODO convert to jQuery
function ToolbarPanel(isCreator) {
  // hash sets: key=instance name, value=instance
  this.toolbarBtns = {};
  this.disabledBtns = {};
  this.prevSelectedBtn = null;
  this.contentNode = new Element('div', { id: 'toolbarContent' });
  this.panel = new mBox({
    title: 'Toolbar',
    content: this.contentNode,
    width: 100,
    height: 200,
    draggable: true,
    target: 'main',
    addClass: { 'title': 'paneltitle' },
    position: {
      x: ['left', 'outside'],
      y: ['center'],
    },
    offset: {
      x: -10,
      y: -5,
    },
    closeOnEsc: false,
    closeOnClick: false,
    closeOnBodyClick: false,
    closeOnMouseleave: false,
    zIndex: 7000, // ensures tooltips show up on top of panel
    id: 'toolbarBox'
  });

  createAndAddButtons.call(this, isCreator);
}
util.inherits(ToolbarPanel, events.EventEmitter);
module.exports = ToolbarPanel;

function createAndAddButtons(isCreator) {
  // create the buttons
  var deleteBtnName = 'delete';
  this.toolbarBtns[deleteBtnName] = new ToolbarButton(deleteBtnName, 'Delete '+(isCreator ? 'an object or textbox' : 'textbox or action'));
  this.toolbarBtns[deleteBtnName].on('click', function() {
    this.setSelectedBtn(this.toolbarBtns[deleteBtnName]); 
    this.emit(deleteBtnName+'Clicked');
  }.bind(this));

  var moveBtnName = 'move';
  this.toolbarBtns[moveBtnName] = new ToolbarButton(moveBtnName, 'Move '+(isCreator ? 'hero, object, or textbox' : 'hero, textbox, or action'));
  this.toolbarBtns[moveBtnName].on('click', function() {
    this.setSelectedBtn(this.toolbarBtns[moveBtnName]);
    this.emit(moveBtnName+'Clicked');
  }.bind(this));

  var textboxBtnName = 'textbox';
  this.toolbarBtns[textboxBtnName] = new ToolbarButton(textboxBtnName, 'Insert a dialog box'+(isCreator ? '' : ' for your character'));
  this.toolbarBtns[textboxBtnName].on('click', function() {
    this.setSelectedBtn(this.toolbarBtns[textboxBtnName]);
    this.emit(textboxBtnName+'Clicked');
  }.bind(this));

  if (isCreator) {
    var editBtnName = 'edit';
    this.toolbarBtns[editBtnName] = new ToolbarButton(editBtnName, 'Edit object');
    this.toolbarBtns[editBtnName].on('click', function() {
      //this.setSelectedBtn(this.toolbarBtns[editBtnName]); // TODO select this once it gets implemented
      this.emit(editBtnName+'Clicked');
    }.bind(this));

    var clearBtnName = 'clear';
    // require a prompt to be accepted for this button before the click event is fired
    this.toolbarBtns[clearBtnName] = new ToolbarButton(clearBtnName, 'Clear the world', 'Clearing the screen deletes all tiles and objects that have been placed. Are you sure?');
    this.toolbarBtns[clearBtnName].on('click', function() {
      this.emit(clearBtnName+'Clicked');
    }.bind(this));
  } else {
    var actionBtnName = 'action';
    this.toolbarBtns[actionBtnName] = new ToolbarButton(actionBtnName, 'Insert an action for your character');
    this.toolbarBtns[actionBtnName].on('click', function() {
      this.setSelectedBtn(this.toolbarBtns[actionBtnName]);
      this.emit(actionBtnName+'Clicked');
    }.bind(this));
  }

  // add the buttons to the content node
  Object.each(this.toolbarBtns, function(btn, btnName) {
    this.contentNode.grab(btn.element);
  }, this);
}

ToolbarPanel.prototype.setEnabled = function(enabled) {
  Object.each(this.toolbarBtns, function(btn, btnName) {
    if (!this.disabledBtns[btnName]) btn.setEnabled(enabled);
  }, this);
};

ToolbarPanel.prototype.setSelectedBtn = function(toolbarBtn) {
  toolbarBtn.element.addClass('selectedBtn');
  if (this.prevSelectedBtn && this.prevSelectedBtn != toolbarBtn) this.prevSelectedBtn.element.removeClass('selectedBtn');
  this.prevSelectedBtn = toolbarBtn;
  this.emit('selectionChanged', toolbarBtn);
};

ToolbarPanel.prototype.clearSelectedBtn = function() {
  if (this.prevSelectedBtn) this.prevSelectedBtn.element.removeClass('selectedBtn');
  this.prevSelectedBtn = null;
};

ToolbarPanel.prototype.clickBtn = function(btnName) {
  this.toolbarBtns[btnName].emit('click');
};

ToolbarPanel.prototype.disableBtn = function(btnName) {
  var btn = this.toolbarBtns[btnName];
  btn.element.set('disabled', 'disabled');
  this.disabledBtns[btnName] = btn;
};

ToolbarPanel.prototype.enableBtn = function(btnName) {
  var btn = this.toolbarBtns[btnName];
  btn.element.erase('disabled');
  delete this.disabledBtns[btnName];
};

ToolbarPanel.prototype.enableAllBtns = function() {
  Object.each(this.disabledBtns, function(btn, btnName) {
    btn.element.erase('disabled');
  });
  this.disabledBtns = {};
};

ToolbarPanel.prototype.show = function() {
  this.panel.open();
};

ToolbarPanel.prototype.hide = function() {
  this.panel.close();
};

ToolbarPanel.prototype.destroy = function() {
  this.panel.destroy(); // recursively destroys all children too
};