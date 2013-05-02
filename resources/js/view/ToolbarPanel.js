var ToolbarPanel = new Class({
	Implements: Events,

	toolbarBtns: null,
	disabledBtns: null,
	prevSelectedBtn: null,
	contentNode: null,
	panel: null,

	initialize: function(isCreator) {
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

		this._createAndAddButtons(isCreator);

		//TODO
		// initially use the action button for the Player
		//toolbarBtns['actionBtn'].fireEvent('click');
	},

	_createAndAddButtons: function(isCreator) {
		// create the buttons
		var deleteBtnName = 'delete';
		this.toolbarBtns[deleteBtnName] = new ToolbarButton(deleteBtnName, 'Delete '+(isCreator ? 'an object or textbox (textbox deletion not implemented yet)' : 'textbox or action'));
		this.toolbarBtns[deleteBtnName].addEvent('click', function() {
			if (isCreator) this.setSelectedBtn(this.toolbarBtns[deleteBtnName]);  // TODO select this for the player too once it gets implemented

			this.fireEvent(deleteBtnName+'Clicked');
		}.bind(this));

		var moveBtnName = 'move';
		this.toolbarBtns[moveBtnName] = new ToolbarButton(moveBtnName, 'Move '+(isCreator ? 'an object or textbox' : 'textbox or action'));
		this.toolbarBtns[moveBtnName].addEvent('click', function() {
			//this.setSelectedBtn(this.toolbarBtns[moveBtnName]); // TODO select this once it gets implemented
			this.fireEvent(moveBtnName+'Clicked');
		}.bind(this));

		var textboxBtnName = 'textbox';
		this.toolbarBtns[textboxBtnName] = new ToolbarButton(textboxBtnName, 'Insert a dialog box'+(isCreator ? '' : ' for your character'));
		this.toolbarBtns[textboxBtnName].addEvent('click', function() {
			this.setSelectedBtn(this.toolbarBtns[textboxBtnName]);
			this.fireEvent(textboxBtnName+'Clicked');
		}.bind(this));

		if (isCreator) {
			var editBtnName = 'edit';
			this.toolbarBtns[editBtnName] = new ToolbarButton(editBtnName, 'Edit object');
			this.toolbarBtns[editBtnName].addEvent('click', function() {
				//this.setSelectedBtn(this.toolbarBtns[editBtnName]); // TODO select this once it gets implemented
				this.fireEvent(editBtnName+'Clicked');
			}.bind(this));

			var clearBtnName = 'clear';
			this.toolbarBtns[clearBtnName] = new ToolbarButton(clearBtnName, 'Clear the world', 'Clearing the screen deletes all tiles and objects that have been placed. Are you sure?');
			this.toolbarBtns[clearBtnName].addEvent('click', function() {
				this.fireEvent(clearBtnName+'Clicked');
			}.bind(this));
		} else {
			var actionBtnName = 'action';
			this.toolbarBtns[actionBtnName] = new ToolbarButton(actionBtnName, 'Insert an action for your character');
			this.toolbarBtns[actionBtnName].addEvent('click', function() {
				this.setSelectedBtn(this.toolbarBtns[actionBtnName]);
				this.fireEvent(actionBtnName+'Clicked');
			}.bind(this));
		}

		// add the buttons to the content node
		Object.each(this.toolbarBtns, function(btn, btnName) {
			this.contentNode.grab(btn.element);
		}, this);
	},

	setEnabled: function(enabled) {
		Object.each(this.toolbarBtns, function(btn, btnName) {
			if (!this.disabledBtns[btnName]) btn.setEnabled(enabled);
		}, this);
	},

	setSelectedBtn: function(toolbarBtn) {
		toolbarBtn.element.addClass('selectedBtn');
		if (this.prevSelectedBtn && this.prevSelectedBtn != toolbarBtn) this.prevSelectedBtn.element.removeClass('selectedBtn');
		this.prevSelectedBtn = toolbarBtn;
		this.fireEvent('selectionChanged', toolbarBtn);
	},

	clearSelectedBtn: function() {
		if (this.prevSelectedBtn && this.prevSelectedBtn != toolbarBtn) this.prevSelectedBtn.element.removeClass('selectedBtn');
		this.prevSelectedBtn = null;
	},

	disableBtn: function(btnName) {
		var btn = this.toolbarBtns[btnName];
		btn.element.set('disabled', 'disabled');
		this.disabledBtns[btnName] = btn;
	},

	enableBtn: function(btnName) {
		var btn = this.toolbarBtns[btnName];
		btn.element.erase('disabled');
		delete this.disabledBtns[btnName];
	},


	show: function() {
		this.panel.open();
	},

	hide: function() {
		this.panel.close();
	},

	destroy: function() {
		this.panel.destroy(); // recursively destroys all children too
	}

});