/**
 * Represents an actual game being played by a creator or player.
 * Does not handle any socket or DOM logic (other than the canvas);
 * that is done through event listeners.
 * @type {Class}
 */
var Game = new Class({
	Implements: Events,
	Binds: ['beginTurn', 'gameLoop', '_mouseDownHandler'], // see: http://mootools.net/docs/more/Class/Class.Binds

	heroImageUrl: 'images/hero/hero.png',
	heroSpeed: 256,
	active: null,
	isCreator: null,
	stage: null,
	width: null,
	height: null,
	tileSize: null,
	hero: null,
	objectBoard: null,
	tileBoard: null,
	stateChanges: null,
	objectTypeMap: null,
	tileTypeMap: null,
	currentTileType: null,
	currentObjectType: null,

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
		this.objectTypeMap = {};
		this.tileTypeMap = {};

		// create the stage
		this.stage = new createjs.Stage(canvas);
		console.log('INFO: Canvas: ' + this.width + 'px x ' + this.height +'px');
		// create the tile board and add it to the display list
		var numWide = Math.floor(this.width/tileSize);
		var numHigh = Math.floor(this.height/tileSize);
		console.log('INFO: Tile board: '+numWide+ ' x ' + numHigh+ ' tiles at tile size '+tileSize + 'px');
		this.tileBoard = new TileBoard(numWide, numHigh, this.tileSize);
		this.stage.addChild(this.tileBoard.container);
		// create the object board and add it to the display list
		this.objectBoard = new ObjectBoard(numWide, numHigh, this.tileSize);
		this.stage.addChild(this.objectBoard.container);
		// create the hero and add it to the display list
		this.hero = new Hero(this.heroImageUrl, 66, 72, this.heroSpeed, 150, 150);
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
		// initialize the state
		this.stateChanges = {
			'heroPosX': this.hero.x,
			'heroPosY': this.hero.y
		};
		this.fireEvent('gameStarted');
		// the creator starts first
		if (this.isCreator) {
			// TODO this is just temporary to test object/tile placement. Will be replaced once tile selector GUI is done.
			// choose some arbitrary tile and object
			var grass1Type = new TileType('grass1', true);
			var tree1Type = new ObjectType('tree1', false);
			this.tileTypeMap['grass1'] = grass1Type;
			this.objectTypeMap['tree1'] = tree1Type;
			this.currentTileType = grass1Type;
			this.currentObjectType = tree1Type;

			this.beginTurn(this.stateChanges);
		} else {
			// the player just waits
		}
		// loop to keep updating at each tick of the clock
		createjs.Ticker.addEventListener('tick', this.gameLoop);
	},

	// "private" function
	_mouseDownHandler: function(event) {
		// decide where to put it
		var x = event.page.x - this.stage.canvas.getPosition().x;
		var y = event.page.y - this.stage.canvas.getPosition().y;
		x = Math.floor(x / this.tileSize);
		y = Math.floor(y / this.tileSize);
		//console.log('INFO: mouse clicked at: ' + x + ', ' + y + (event.rightClick ? ' right click' : ''));
		if (event.shift) {
			this.objectBoard.setObject(x, y, this.currentObjectType);
			if (!this.stateChanges['objsAdded']) this.stateChanges['objsAdded'] = {};
			// map on x,y to only store the last change at that location
			this.stateChanges['objsAdded'][x+','+y] = {
				id: this.currentObjectType.id,
				x: x,
				y: y,
				isPassable: this.currentObjectType.isPassable
			};
		} else {
			this.tileBoard.setTile(x, y, this.currentTileType);
			if (!this.stateChanges['tilesChanged']) this.stateChanges['tilesChanged'] = {};
			// map on x,y to only store the last change at that location
			this.stateChanges['tilesChanged'][x+','+y] = {
				id: this.currentTileType.id,
				x: x,
				y: y,
				isPassable: this.currentTileType.isPassable
			};
		}
	},

	// "private" function
	_addKeyboardListeners: function() {
		// add keyboard listeners for player
		window.addEvent('keydown', this._keyDownHandler);
		window.addEvent('keyup', this._keyUpHandler);
	},

	// "private" function
	_removeKeyboardListeners: function() {
		// remove keyboard listeners for player
		window.removeEvent('keydown', this._keyDownHandler);
		window.removeEvent('keyup', this._keyUpHandler);
	},

	// "private" function
	_addMouseListener: function() {
		this.stage.canvas.addEvent('mousedown', this._mouseDownHandler);
	},

	// "private" function
	_removeMouseListener: function() {
		this.stage.canvas.removeEvent('mousedown', this._mouseDownHandler);
	},

	/**
	 * Updates the state of the game and all game objects based on a set of changes.
	 * @param {Object} newState The new game state.
	 */
	applyStateChanges: function(changes) {
		if (changes['objsAdded']) {
			var objsAdded = changes['objsAdded'];
			Object.each(objsAdded, function(obj, key) {
				// see if any new images need to be downloaded
				if (!this.objectTypeMap[obj.id]) {
					// fetch the image and store it in the map for later
					this.objectTypeMap[obj.id] = new ObjectType(obj.id, obj.isPassable);
				}
				// add new object to the board
				this.objectBoard.setObject(obj.x, obj.y, this.objectTypeMap[obj.id]);
			}, this);
		}
		if (changes['tilesChanged']) {
			var tilesChanged = changes['tilesChanged'];
			Object.each(tilesChanged, function(tile, key) {
				// see if any new images need to be downloaded
				if (!this.tileTypeMap[tile.id]) {
					// fetch the image and store it in the map for later
					this.tileTypeMap[tile.id] = new TileType(tile.id, tile.isPassable);
				}
				// set new tiles on the board
				this.tileBoard.setTile(tile.x, tile.y, this.tileTypeMap[tile.id]);
			}, this);
		}
		// TODO handle object deletion or object movement
		// update the objects and tiles
		if (changes['heroPosX']) this.hero.x = changes['heroPosX'];
		if (changes['heroPosY']) this.hero.y = changes['heroPosY'];
	},

	/**
	 * Begins a new turn.
	 * @param  {Object} changes The new state changes to apply at the beginning of this turn.
	 */
	beginTurn: function(changes) {
		if (!this.active) {
			console.log('INFO: Turn started');
			this.active = true;

			// reset record of changes for this turn
			this.stateChanges = {};

			// (re)initialize the state
			this.applyStateChanges(changes);
			
			if (this.isCreator) {
				this._addMouseListener();
			} else {
				this._addKeyboardListeners();
			}
			this.fireEvent('turnStarted', changes);
		}
	},

	/**
	 * Ends the active turn.
	 * @return {Object} The current state object for the game.
	 */
	endTurn: function() {
		if (this.active) {
			if (this.isCreator) {
				this._removeMouseListener();
			} else {
				this._removeKeyboardListeners();
			}
			// turn is now over
			console.log('INFO: Turn ended');
			this.active = false;
		}
		this.fireEvent('turnEnded', this.stateChanges); // not used currently - just in case someone cares
		return this.stateChanges;
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
		
		if (!this.isCreator) {
			this.hero.updateMove(event.delta); // time elapsed in ms since the last tick
			// update the state changes record of this move
			this.stateChanges['heroPosX'] = this.hero.x;
			this.stateChanges['heroPosY'] = this.hero.y;
		}

		// TODO collision checking goes here

		// render
		this.hero.render();
		this.stage.update();
	},
});