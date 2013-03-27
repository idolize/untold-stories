/**
 * Represents an actual game being played by a creator or player.
 * Does not handle any socket or DOM logic (other than the canvas);
 * that is done through event listeners.
 * @type {Class}
 */
var Game = new Class({
	Implements: Events,
	Binds: ['gameLoop'], // see: http://mootools.net/docs/more/Class/Class.Binds

	active: null,
	isCreator: null,
	stage: null,
	hero: null,
	objectBoard: null,
	tileBoard: null,

	/**
	 * @constructor
	 * @param  {HTMLCanvasElement}  canvas    Canvas to draw game on.
	 * @param  {Boolean} isCreator Is this game played by the creator?
	 */
	initialize: function(canvas, isCreator) {
		// create the stage
		this.stage = new createjs.Stage(canvas);
		this.isCreator = isCreator;
		this.active = false;
	},

	/**
	 * Starts the game.
	 */
	start: function() {
		if (!this.active) {
			this.active = true;
			// initialize the background tiles and the objects in the scene
			this._initBoards();

			// initialize hero
			this.hero = new Hero('http://localhost:8888/images/hero/gohan.GIF', 256, 150, 150);
			this.stage.addChild(this.hero.bitmap);

			// now perform specific logic for creator and player
			// TODO use polymorphism instead?
			if (this.isCreator) {
				this._startCreator();
			} else {
				this._startPlayer();
			}
			// loop to keep updating at each tick of the clock
			createjs.Ticker.addEventListener('tick', this.gameLoop); // Note: bind is needed to ensure the function is called with the right 'this' scoping
		} else console.log('Error: cannot start game already in progress');
	},

	// "private" function
	_initBoards: function() {
		// load images from server
		var image1 = new Image();
		image1.src = 'http://localhost:8888/images/tiles/1.png';

		// create the tile types for these images
		var type1 = new TileType(1, image1); //TODO these types will be stored somewhere

		// create the board and display it
		this.board = new Board(20, 15, 20);
		this.stage.addChild(this.board.container);

		// update some of the tiles on the board
		this.board.setTile(0, 0, type1);
		this.board.setTile(1, 0, type1);
		this.board.setTile(2, 0, type1);
		this.board.setTile(0, 1, type1);
		//this.board.setTile(1, 1, type2); // inner box
		this.board.setTile(2, 1, type1);
		this.board.setTile(0, 2, type1);
		this.board.setTile(1, 2, type1);
		this.board.setTile(2, 2, type1);

		// load image from server
		var image2 = new Image();
		image2.src = 'http://localhost:8888/images/tiles/2.png';
		// create the object type
		var object1 = new ObjectType(1, image2);
		// create object board and display it
		this.objectBoard = new ObjectBoard(20, 15, 20);
		this.stage.addChild(this.objectBoard.container);

		// add some objects to the board
		this.objectBoard.setObject(1, 0, object1);
		this.objectBoard.setObject(1, 2, object1);
	},

	// "private" function
	_startCreator: function() {
		// TODO do something for the creator
		this._mouseDown = function(event) {
			// TODO - the tile type needs to be selected some other way and pulled from another datastructure
			var image1 = new Image();
			if (event.shift) {
				image1.src = 'http://localhost:8888/images/tiles/2.png';
			} else {
				image1.src = 'http://localhost:8888/images/tiles/1.png';
			}

			// create the tile types for these images
			var type1 = new TileType((event.shift? 2 : 1), image1); //TODO these types will be stored somewhere

			// decide where to put it
			var x = event.client.x - this.stage.canvas.getPosition().x;
			var y = event.client.y - this.stage.canvas.getPosition().y;
			// TODO - the divisor here needs to be a constant defined elsewhere
			x = Math.floor(x / 20);
			y = Math.floor(y / 20);
			console.log('mouse clicked at: ' + x + ', ' + y + (event.rightClick ? ' right click' : ''));
			this.board.setTile(x, y, type1);
		}.bind(this);
		console.log('_startCreator called');
		this.stage.canvas.addEvent('mousedown', this._mouseDown);
	},

	// "private" function
	_startPlayer: function() {
		// add keyboard listeners for player
		// store these function callbacks to make them easier to remove later
		this._keyDownHandler = function(event) {
			this.hero.keyDown(event.key);
		}.bind(this);
		this._keyUpHandler = function(event) {
			this.hero.keyUp(event.key);
		}.bind(this);

		window.addEvent('keydown', this._keyDownHandler);
		window.addEvent('keyup', this._keyUpHandler);
	},

	/**
	 * Stops the game.
	 */
	stop: function() {
		if (this.active) {
			this.active = false;
			if (!this.isCreator) {
				// remove keyboard listeners
				window.removeEvent('keydown', this._keyDownHandler);
				window.removeEvent('keyup', this._keyUpHandler);
			}
			// stop game timer
			createjs.Ticker.removeEventListener('tick', this.gameLoop);
		} else console.log('Error: cannot stop game not in progress');
	},

	/**
	 * Called at each frame update.
	 * @param  {Object} event Event object.
	 * @see  <a href="http://www.createjs.com/Docs/EaselJS/classes/Ticker.html#event_tick">Event payload</a>
	 */
	gameLoop: function(event) {
		// update the game logic
		this.hero.updateMove(event.delta); // time elapsed in ms since the last tick

		// TODO collision checking goes here

		// render
		this.hero.render();
		this.stage.update();
	},
});