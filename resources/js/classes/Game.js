/**
 * Represents an actual game being played by a creator or player.
 * Does not handle any socket or DOM logic (other than the canvas);
 * that is done through event listeners.
 * @type {Class}
 */
var Game = new Class({
	Implements: Events,

	isCreator : null,
	stage : null,

	/**
	 * @constructor
	 * @param  {HTMLCanvasElement}  canvas    Canvas to draw game on.
	 * @param  {Boolean} isCreator Is this game played by the creator?
	 */
	initialize: function(canvas, isCreator) {
		this.isCreator = isCreator;
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
		board.setTile(0,0, type1);
		board.setTile(1,0, type1);
		board.setTile(2,0, type1);
		board.setTile(0,1, type1);
		board.setTile(1,1, type2); // inner box
		board.setTile(2,1, type1);
		board.setTile(0,2, type1);
		board.setTile(1,2, type1);
		board.setTile(2,2, type1);

		var boardTile = new BoardTile(type2);
		board.setTileWithExisting(5,5, boardTile);

		/**
		 * hero test
		 */
		var hero_image = new Image();
		hero_image.src = 'http://localhost:8888/images/hero/gohan.GIF';
		// create the hero for this image
		var hero = new Hero(3, hero_image);
		// create the hero board and display it
		var hero_board = new HeroBoard(20, 15);
		this.stage.addChild(hero_board.container);

		//update the hero to the board
		hero_board.setHero(5,6, hero);

		// hero render

		/**
		 *  handle keyboard input
		 */
		var keyDown = {};

		addEventListener("keydown", function (e) {
			keyDown[e.keyCode] = true;
		}, false);

		addEventListener("keyup", function (e) {
			delete keyDown[e.keyCode];
		}, false);

		// movement
		var updateMove = function (modifier) {
			if (38 in keyDown) { // Player holding up
				hero.y -= hero.speed * modifier;
			}
			if (40 in keyDown) { // Player holding down
				hero.y += hero.speed * modifier;
			}
			if (37 in keyDown) { // Player holding left
				hero.x -= hero.speed * modifier;
			}
			if (39 in keyDown) { // Player holding right
				hero.x += hero.speed * modifier;
			}
		};

		// movement loop
		var moveLoop = function () {
			var now = Date.now();
			var delta = now - then;

			updateMove(delta / 1000);
			//heroRender();

			then = now;
		};


		// loop to keep updating at each tick of the clock
		createjs.Ticker.addEventListener('tick', this.gameLoop.bind(this)); // Note: bind is needed to ensure the function is called with the right 'this' scoping
	},

	/**
	 * Called at each frame update.
	 * @param  {Object} event Event object.
	 * @see  <a href="http://www.createjs.com/Docs/EaselJS/classes/Ticker.html#event_tick">Event payload</a>
	 */
	gameLoop: function(event) {
		moveLoop();
		this.stage.update();
	}
});