var Tutorial = new Class({
	Binds: ['start'],

	intro: null,

	initialize: function(isCreator) {
		this.intro = introJs();
		var steps = (isCreator ? this._getStepsForCreator() : this._getStepsForPlayer());
		this.intro.setOptions({steps: steps});
	},

	_getStepsForCreator: function() {
		return [
		{
			element: document.id('logo'),
			intro: 'Welcome to Tabula Rasa! In this game you will be creating a story for another person to play through. (Click next or use the arrow keys to proceed)'
		},
		{
			element: document.id('infobar'),
			intro: 'This bar always shows what your role is and your current status.',
			position: 'bottom'
		},
		{
			element: document.id('gamecanvas'),
			intro: 'This is the game world you will be creating.',
			position: 'bottom'
		},
		{
			element: document.id('toolbarBox'),
			intro: 'This is a panel- you can drag these around. This panel is used for selecting your current tool.',
			position: 'right'
		},
		{
			element: document.id('selectorTabs'),
			intro: 'This panel lets you pick what tile or object you want to place.\nJust click to select the tile or object and then click to place one in the world (or click and drag to place several at once).',
			position: 'left'
		}
		];
	},

	_getStepsForPlayer: function() {
		return [
		{
			element: document.id('logo'),
			intro: 'Welcome to Tabula Rasa! In this game you will be playing through a story created by another person. (Click next or use the arrow keys to proceed)'
		},
		{
			element: document.id('infobar'),
			intro: 'This bar always shows what your role is and your current status.',
			position: 'bottom'
		},
		{
			element: document.id('gamecanvas'),
			intro: 'This is the game world scene you will be playing in. Use the arrow keys to move the hero around the scene.',
			position: 'bottom'
		},
		{
			element: document.id('textboxToolBtn'),
			intro: 'Use this button to insert dialog.  You can only insert one dialog box per turn so use it wisely.',
			position: 'bottom'
		},
		{
			element: document.id('actionToolBtn'),
			intro: 'Use this button to insert an action.  An action is a text box that describes what your character is doing.  You can only place one action per turn, so use it wisely.',
			position: 'bottom'
		},
		]
	},

	start: function() {
		this.intro.start();
	}

});
