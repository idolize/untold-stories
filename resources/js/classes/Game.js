/**
 * Represents an actual game being played by a creator or player.
 * Does not handle any socket or DOM logic (other than the canvas);
 * that is done through event listeners.
 * @type {Class}
 */
var Game = new Class({
	Implements: Events,
	Binds: ['beginTurn', 'gameLoop'], // see: http://mootools.net/docs/more/Class/Class.Binds

	heroSpeed: 256,
	active: null,
	isCreator: null,
	stage: null,
	width: null,
	height: null,
	tileSize: null,
	hero: null,
	oldHeroPos: null,
	objectBoard: null,
	tileBoard: null,
	currentState: null,

	/**
	 * @constructor
	 * @param  {HTMLCanvasElement}  canvas    Canvas to draw game on.
	 * @param  {integer} tileSize The size of each tile (width and height are the same) in pixels. Should be a multiple of the canvas size.
	 * @param  {Boolean} isCreator Is this game played by the creator?
	 */
	initialize: function(canvas, tileSize, isCreator) {
		this.width = canvas.width;
		this.height = canvas.height;
		this.tileSize = tileSize;
		this.isCreator = isCreator;
		this.active = false;

		// create the stage
		this.stage = new createjs.Stage(canvas);
		console.log('INFO: Canvas: ' + this.width + 'px x ' + this.height +'px');
		// create the tile board and add it to the display list
		console.log('INFO: Tile board: '+Math.floor(this.width/tileSize) + ' x ' + Math.floor(this.height/tileSize) + ' tiles at tile size '+tileSize + 'px');
		this.board = new TileBoard(Math.floor(this.width/tileSize), Math.floor(this.height/tileSize), this.tileSize);
		this.stage.addChild(this.board.container);
		// create the object board and add it to the display list
		this.objectBoard = new ObjectBoard(20, 15, 20);
		this.stage.addChild(this.objectBoard.container);
		// create the hero and add it to the display list
		this.hero = new Hero('images/hero/gohan.GIF', 66, 72, this.heroSpeed, 150, 150);
		this.stage.addChild(this.hero.bitmap);
		// store these function callbacks to make them easier to remove later
		this._keyDownHandler = function(event) {
			this.hero.keyDown(event.key);
		}.bind(this);
		this._keyUpHandler = function(event) {
			this.hero.keyUp(event.key);
		}.bind(this);
	},

	/**
	 * Starts the game.
	 */
	start: function() {
		console.log('Game.start called');
		// initialize the state
		this.currentState = {
			'heroPosX': this.hero.x,
			'heroPosY': this.hero.y
		};
		this.fireEvent('gameStarted');
		// the creator starts first
		if (this.isCreator) {
			this.beginTurn(this.currentState);
		} else {
			// the player just waits
		}
		// loop to keep updating at each tick of the clock
		createjs.Ticker.addEventListener('tick', this.gameLoop);
	},

	// "private" function
	_addKeyboardListeners: function() {
		// add keyboard listeners for player
		console.log('keyboard listers go');
		window.addEvent('keydown', this._keyDownHandler);
		window.addEvent('keyup', this._keyUpHandler);
	},

	// "private" function
	_removeKeyboardListeners: function() {
		// remove keyboard listeners for player
		console.log('keyboard listers die');
		window.removeEvent('keydown', this._keyDownHandler);
		window.removeEvent('keyup', this._keyUpHandler);
	},

	setNewState: function(newState) {
		console.log('Game.setNewState');
		console.log(newState);
		this.currentState = newState;
		// update the objects and tiles
		this.hero.x = newState['heroPosX'];
		this.hero.y = newState['heroPosY'];
	},

	updateState: function(stateVarName, newVal) {
		this.currentState[stateVarName] = newVal;
	},

	beginTurn: function(newState) {
		console.log('Game.beginTurn called. newState:');
		console.log(newState);
		if (!this.active) {
			console.log('INFO: Turn started');
			this.active = true;

			// (re)initialize the state
			this.setNewState(newState);
			
			if (this.isCreator) {
				// TODO start creator's turn
			} else {
				this._addKeyboardListeners();
			}
			this.fireEvent('turnStarted', newState);
		}
	},

	endTurn: function() {
		console.log('Game.endTurn called');
		if (this.active) {
			if (this.isCreator) {
				// TODO stop creator's turn
			} else {
				this._removeKeyboardListeners();
			}
			// turn is now over
			console.log('INFO: Turn ended');
			this.active = false;
		}
		this.fireEvent('turnEnded', this.currentState); // not used currently - just in case someone cares
		return this.currentState;
	},


	/**
	 * Ends the game.
	 */
	endGame: function() {
		// force any active turn to end
		if (this.active) endTurn();
		// stop game timer
		createjs.Ticker.removeEventListener('tick', this.gameLoop);
		this.fireEvent('gameOver');
	},

	/**
	 * Called at each frame update.
	 * @param  {Object} event Event object.
	 * @see  <a href="http://www.createjs.com/Docs/EaselJS/classes/Ticker.html#event_tick">Event payload</a>
	 */
	gameLoop: function(event) {
		// update the game logic
		this.hero.updateMove(event.delta); // time elapsed in ms since the last tick
		

		this.updateState('heroPosX', this.hero.x);
		this.updateState('heroPosY', this.hero.y);

		// TODO collision checking goes here

		// render
		this.hero.render();
		this.stage.update();
	},
});