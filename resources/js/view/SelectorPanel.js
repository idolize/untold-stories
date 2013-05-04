var SelectorPanel = new Class({
	Implements: Events,

	tabs: null,
	tileBtns: null,
	objBtns: null,
	prevSelectedBtn: null,
	panel: null,

	initialize: function(tileTypes, objectTypes) {
		// hash sets: key=instance name, value=instance
		this.tileBtns = [];
		this.objBtns = [];
		this.prevSelectedBtn = null;
		var selectorTabs = new Element('div', { id: 'selectorTabs' });
		var tabsList = new Element('ul', { 'class': 'tabs' });
		tabsList.grab(new Element('li', { text: 'Tiles' }));
		tabsList.grab(new Element('li', { text: 'Objects' }));
		var contentsList = new Element('ul', { 'class': 'contents' });
		contentsList.grab(new Element('li', { id: 'tileSelect' }));
		contentsList.grab(new Element('li', { id: 'objectSelect' }));
		selectorTabs.grab(tabsList);
		selectorTabs.grab(contentsList);
		this.panel = new mBox({
			title: 'Tiles and Objects',
			content: selectorTabs,
			width: 200,
			draggable: true,
			target: 'main',
			addClass: {
				'title': 'paneltitle'
			},
			position: {
				x: ['right', 'outside'],
				y: ['center'],
			},
			offset: {
				x: 10,
				y: -5,
			},
			closeOnEsc: false,
			closeOnClick: false,
			closeOnBodyClick: false,
			closeOnMouseleave: false,
			openOnInit: true,
			zIndex: 7000, // ensures tooltips show up on top of panel
			id: 'selectorBox'
		});
		this.tabs = new TinyTab(tabsList.getChildren(), contentsList.getChildren());

		this._createAndAddButtons(tileTypes, objectTypes);
	},

	_createAndAddButtons: function(tileTypes, objectTypes) {
		var parent = this; // used for closure instead of relying on binding

		// create the buttons
		for (var i = 0; i < tileTypes.length; i++) {
			var type = tileTypes[i];
			var imgBtn = new ImageButton(type, true);
			imgBtn.addEvent('click', function() {
				parent.setSelectedBtn(this);
				parent.fireEvent('tileBtnClicked', this);
			});
			imgBtn.element.inject('tileSelect');
			this.tileBtns.push(imgBtn);
		}
		for (var i = 0; i < objectTypes.length; i++) {
			var type = objectTypes[i];
			var imgBtn = new ImageButton(type, false);
			imgBtn.addEvent('click', function() {
				parent.setSelectedBtn(this);
				parent.fireEvent('objBtnClicked', this);
			});
			imgBtn.element.inject('objectSelect');
			this.objBtns.push(imgBtn);
		}
	},

	setEnabled: function(enabled) {
		Object.each(this.tileBtns, function(btn, btnName) {
			btn.setEnabled(enabled);
		});
		Object.each(this.objBtns, function(btn, btnName) {
			btn.setEnabled(enabled);
		});
	},

	setSelectedBtn: function(imgBtn) {
		imgBtn.element.addClass('selectedBtn');
		if (this.prevSelectedBtn && this.prevSelectedBtn != imgBtn) this.prevSelectedBtn.element.removeClass('selectedBtn');
		this.prevSelectedBtn = imgBtn;
		this.fireEvent('selectionChanged', imgBtn);
	},

	clearSelectedBtn: function() {
		if (this.prevSelectedBtn) this.prevSelectedBtn.element.removeClass('selectedBtn');
		this.prevSelectedBtn = null;
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