/**
 * Represents an actual game being played by a creator or player.
 * Does not handle any socket or DOM logic (other than the canvas);
 * that is done through event listeners.
 * @type {Class}
 */
var Game = new Class({
	Implements: Events,

	isCreator: null,
	stage: null,
	hero: null,

	/**
	 * @constructor
	 * @param  {HTMLCanvasElement}  canvas    Canvas to draw game on.
	 * @param  {Boolean} isCreator Is this game played by the creator?
	 */
	initialize: function(canvas) {
		// create the stage
		this.stage = new createjs.Stage(canvas);
	},

	/**
	 * Starts the game.
	 */
	start: function() {
		/*
		 * test EaselJS
		 */
		
		// load images from server
		var image1 = new Image();
		image1.src = 'http://localhost:8888/images/tiles/1.png';
		var image2 = new Image();
		image2.src = 'http://localhost:8888/images/tiles/2.png';
		// create the tile types for these images
		var type1 = new TileType(1, image1);
		var type2 = new TileType(2, image2);
		// create the board and display it
		var board = new Board(20, 15, 20);
		this.stage.addChild(board.container);

		// update some of the tiles on the board
		board.setTile(0, 0, type1);
		board.setTile(1, 0, type1);
		board.setTile(2, 0, type1);
		board.setTile(0, 1, type1);
		board.setTile(1, 1, type2); // inner box
		board.setTile(2, 1, type1);
		board.setTile(0, 2, type1);
		board.setTile(1, 2, type1);
		board.setTile(2, 2, type1);

		var boardTile = new BoardTile(type2);
		board.setTileWithExisting(5, 5, boardTile);

		/*
		 * hero test
		 */

		this.hero = new Hero('http://localhost:8888/images/hero/gohan.GIF', 256, 150, 150);

		this.stage.addChild(this.hero.bitmap);

		// add keyboard listeners
		window.addEvent('keydown', function(event) {
			this.hero.keyDown(event.key);
		}.bind(this));
		window.addEvent('keyup', function(event) {
			this.hero.keyUp(event.key);
		}.bind(this));

		this._keyDownHandler = function(event) {
			this.hero.keyDown(event.key);
		}.bind(this);

		this._keyUpHandler = function(event) {
			this.hero.keyUp(event.key);
		}.bind(this);

		window.addEvent('keydown', this._keyDownHandler);
		window.addEvent('keyup', this._keyUpHandler);

		/*window.removeEvent('keydown', this._keyDownHandler);
		window.removeEvent('keyup', this._keyUpHandler);*/

		// loop to keep updating at each tick of the clock
		createjs.Ticker.addEventListener('tick', this.gameLoop.bind(this)); // Note: bind is needed to ensure the function is called with the right 'this' scoping
	},

	/**
	 * Called at each frame update.
	 * @param  {Object} event Event object.
	 * @see  <a href="http://www.createjs.com/Docs/EaselJS/classes/Ticker.html#event_tick">Event payload</a>
	 */
	gameLoop: function(event) {

		// event.delta == the time elapsed in ms since the last tick.
		// update the game logic
		this.hero.updateMove(event.delta);

		// render
		this.hero.render();
		this.stage.update();
	},
});