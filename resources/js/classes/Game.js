/**
 * Represents an actual game being played by a creator or player.
 * Does not handle any socket or DOM logic (other than the canvas);
 * that is done through event listeners.
 * @type {Class}
 */
var Game = new Class({
	Implements: Events,
	Binds: ['beginTurn', 'gameLoop', 'addTextbox', 'removeTextbox', 'addAction', 'removeAction'], // see: http://mootools.net/docs/more/Class/Class.Binds

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
	textBoxes: null,
	textBoxesContainer: null,
	numTextboxesByMe: null,
	actionBox: null,

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
		this.textBoxes = {};
		this.numTextboxesByMe = 0;

		// create the stage
		this.stage = new createjs.Stage(canvas);
		console.log('INFO: Canvas: ' + this.width + 'px x ' + this.height + 'px');
		// create the tile board and add it to the display list
		var numWide = Math.floor(this.width / tileSize);
		var numHigh = Math.floor(this.height / tileSize);
		console.log('INFO: Tile board: ' + numWide + ' x ' + numHigh + ' tiles at tile size ' + tileSize + 'px');
		this.tileBoard = new TileBoard(numWide, numHigh, this.tileSize);
		// initialize scene
		this.tileBoard.setAllTilesToOneType(this.getTileTypeInstance(globals.initialTileId));
		this.stage.addChild(this.tileBoard.container);
		// create the object board and add it to the display list
		this.objectBoard = new ObjectBoard(numWide, numHigh, this.tileSize);
		this.stage.addChild(this.objectBoard.container);
		// create the hero and add it to the display list
		this.hero = new Hero(this.heroImageUrl, 66, 72, this.heroSpeed, 150, 150);
		this.stage.addChild(this.hero.bitmap);
		this.textBoxesContainer = new createjs.Container();
		this.stage.addChild(this.textBoxesContainer);
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

			this.beginTurn(this.stateChanges);
		} else {
			// the player just waits
		}
		// loop to keep updating at each tick of the clock
		createjs.Ticker.addEventListener('tick', this.gameLoop);
	},

	placeObject: function(objectType, x, y) {
		console.log('Game.js: placeObject called with pos=('+x+','+y+') and objectType.id='+objectType.id);
		this.objectBoard.setObject(x, y, objectType);
		if (!this.stateChanges['objsChanged']) this.stateChanges['objsChanged'] = {};
		// map on x,y to only store the last change at that location
		this.stateChanges['objsChanged'][x + ',' + y] = {
			id: objectType.id,
			x: x,
			y: y,
			isPassable: objectType.isPassable
		};
	},

	placeTile: function(tileType, x, y) {
		console.log('Game.js: placeTile called with pos=('+x+','+y+') and tileType.id='+tileType.id);
		this.tileBoard.setTile(x, y, tileType);
		if (!this.stateChanges['tilesChanged']) this.stateChanges['tilesChanged'] = {};
		// map on x,y to only store the last change at that location
		this.stateChanges['tilesChanged'][x + ',' + y] = {
			id: tileType.id,
			x: x,
			y: y,
			isPassable: tileType.isPassable
		};
	},

	moveHero: function(newX, newY) {
		this.hero.x = newX;
		this.hero.y = newY;
		this.stateChanges['heroPosX'] = this.hero.x;
		this.stateChanges['heroPosY'] = this.hero.y;

		// TODO move associated textbox too if need be
	},

	deleteObject: function(x, y) {
		this.objectBoard.deleteObject(x, y);
		// check if this is a message that has been committed yet or not
		if (this.stateChanges['objectsAdded'] && this.stateChanges['objectsAdded'][x + ',' + y]) {
			// just clear out the state changes instead of sending both an 'add' and 'delete' message for the same object
			delete this.stateChanges['objectsAdded'][x + ',' + y];
		} else {
			if (!this.stateChanges['objectsDeleted']) this.stateChanges['objectsDeleted'] = {};
			this.stateChanges['objectsDeleted'][x + ',' + y] = true;
		}
	},

	addTextbox: function(element, text, x, y, onlyLocal) {
		console.log('Game.js: adding textbox at ('+x+','+y+')');

		var textbox = new TextBox(element, text, x, y, false);
		this.textBoxes[x + ',' + y] = textbox;
		this.textBoxesContainer.addChild(textbox.domElement);

		if (!onlyLocal) {
			if (!this.stateChanges['textboxesAdded']) this.stateChanges['textboxesAdded'] = {};
			this.stateChanges['textboxesAdded'][x + ',' + y] = { text: text, x: x, y: y };
			this.numTextboxesByMe += 1;
		}
	},

	/**
	 * Only called during the same turn to remove a textbox the player/creator decides they don't want anymore.
	 * Not needed between turns because textboxes automatically clear.
	 * @param  {integer} x The x coordinate of the textbox being removed.
	 * @param  {integer} y The y coordinate of the textbox being removed.
	 */
	removeTextbox: function(x, y) {
		this.textBoxesContainer.removeChild(this.textBoxes[x + ',' + y].domElement);
		this.textBoxes[x + ',' + y].domElement.htmlElement.destroy();
		delete this.textBoxes[x + ',' + y];
		if (this.stateChanges['textboxesAdded'] && this.stateChanges['textboxesAdded'][x + ',' + y]) {
			delete this.stateChanges['textboxesAdded'][x + ',' + y];
			if (Object.keys(this.stateChanges['textboxesAdded']).length == 0) delete this.stateChanges['textboxesAdded'];
		}
	},

	addAction: function(element, text, x, y, onlyLocal) {
		console.log('Game.js: adding actionnn at ('+x+','+y+')');

		this.actionBox = new TextBox(element, text, x, y, true);
		this.stage.addChild(this.actionBox.domElement);

		if (!onlyLocal) {
			this.stateChanges['actionAdded'] = { text: text, x: x, y: y };
		}
	},

	removeAction: function(x, y) {
		this.removeChild(actionBox.domElement);
		this.actionBox.domElement.htmlElement.destroy();
		this.actionBox = null;
		if (this.stateChanges['actionAdded']) {
			delete this.stateChanges['actionAdded'];
		}
	},

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

	/**
	 * Updates the state of the game and all game objects based on a set of changes.
	 * @param {Object} changes The new game state changes.
	 */
	applyStateChanges: function(changes) {
		// if scene cleared
		if (changes['cleared']) {
			this.clearScreen(false);
		}
		if (changes['textboxesAdded']) {
			var textAdded = changes['textboxesAdded'];
			Object.each(textAdded, function(textbox, key) {
				this.fireEvent('textboxNeedsConstructing', textbox);
			}, this);
		}
		if (changes['actionAdded']) {
			this.fireEvent('actionNeedsConstructing', changes['actionAdded']);
		}
		// update objects
		if (changes['objsChanged']) {
			var objsChanged = changes['objsChanged'];
			Object.each(objsChanged, function(obj, key) {
				if (obj.id == null) { // delete the object
					//console.log('INFO: Deleted object at: ', obj.x, ',', obj.y);
					this.objectBoard.deleteObject(obj.x, obj.y);
				} else { // add a new object
					// see if any new images need to be downloaded
					if (!this.objectTypeMap[obj.id]) {
						// fetch the image and store it in the map for later
						this.objectTypeMap[obj.id] = new ObjectType(obj.id, obj.isPassable);
					}
					// add new object to the board
					this.objectBoard.setObject(obj.x, obj.y, this.objectTypeMap[obj.id]);
				}
			}, this);
		}
		// TODO handle object deletion or object movement
		// update tiles
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
		if (changes['textbox']) {
			this.textFromOtherPlayer = changes['textbox'];
		} else {
			this.textFromOtherPlayer = '';
		}

		// update the hero position
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

			// clear any existing textboxes
			Object.each(this.textBoxes, function(textbox, key) {
				// destroy the DOM node
				textbox.domElement.htmlElement.destroy();
			}, this);
			this.textBoxesContainer.removeAllChildren();
			this.textBoxes = {};
			// clear action
			if (this.actionBox) {
				this.actionBox.domElement.htmlElement.destroy();
				this.stage.removeChild(this.actionBox.domElement);
				this.actionBox = null;
			}

			// (re)initialize the state
			this.applyStateChanges(changes);

			this._addKeyboardListeners(); // allow both player and creator to move the hero with keyboard
			this.fireEvent('turnStarted', changes);
		}
	},

	/**
	 * Ends the active turn.
	 * @return {Object} The current state object for the game.
	 */
	endTurn: function() {
		if (this.active) {
			this._removeKeyboardListeners();
			// turn is now over
			console.log('INFO: Turn ended');
			this.active = false;
		}
		this.fireEvent('turnEnded', this.stateChanges); // not used currently - just in case someone cares to listen
		return this.stateChanges;
	},


	/**
	 * Ends the game.
	 */
	endGame: function() {
		// force any active turn to end
		if (this.active) this.endTurn();
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
		// update the state changes record of this move
		this.stateChanges['heroPosX'] = this.hero.x;
		this.stateChanges['heroPosY'] = this.hero.y;

		// TODO collision checking goes here

		// render
		this.hero.render();
		this.stage.update();
	},

	/**
	 * Gets the existing tile type from the map by id if it exists, if not a new instance is created, added to the map,
	 * and returned.
	 * @param  {String} tileId The id for the tile.
	 * @return {TileType} The associated tile type.
	 */
	getTileTypeInstance: function(tileId) {
		var entry = this.tileTypeMap[tileId];
		if (!entry) {
			entry = new TileType(tileId, true); //TODO handle isPassable
			this.tileTypeMap[tileId] = entry;
		}
		return entry;
	},

	/**
	 * Gets the existing object type from the map by id if it exists, if not a new instance is created, added to the map,
	 * and returned.
	 * @param  {String} objectId The id for the object.
	 * @return {ObjectType} The associated object type.
	 */
	getObjectTypeInstance: function(objectId) {
		var entry = this.objectTypeMap[objectId];
		if (!entry) {
			entry = new ObjectType(objectId, true); //TODO handle isPassable
			this.objectTypeMap[objectId] = entry;
		}
		return entry;
	},

	/**
	 * Clears all objects and tiles from the screen.
	 * @param {boolean} clearChanges if true, set the clear flag in the changes and clear the current changes.
	 */
	clearScreen: function(clearChanges) {
		this.tileBoard.clearBoard();
		this.objectBoard.clearBoard();
		if (clearChanges) {
			this.stateChanges['cleared'] = true;
			this.stateChanges['tilesChanged'] = {};
			this.stateChanges['objsChanged'] = {};
		}
	},
});
