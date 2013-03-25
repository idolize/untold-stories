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
	hero : null,
	//keyDown : {},

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

		/*
		 * hero test
		 */
		
		this.hero = new Hero('http://localhost:8888/images/hero/gohan.GIF', 256, 150, 150);

	/*	// re-init the hero position
		this.hero.x = 200;
		this.hero.y = 200;*/
/*
		this.hero_bitmap = new createjs.Bitmap('http://localhost:8888/images/hero/gohan.GIF');
		//set position
		this.hero_bitmap.x = this.hero.x;
		this.hero_bitmap.y = this.hero.y;*/

		this.stage.addChild(this.hero.bitmap);

		// add keyboard listeners
		window.addEventListener("keydown", function (e) {
			this.hero.keyDown[e.keyCode] = true;
		}.bind(this), false);
		window.addEventListener("keyup", function (e) {
			delete this.hero.keyDown[e.keyCode];
		}.bind(this), false);
		// NOTE: you should probably have a way to remove these listeners later (like when the game is over/stopped/restarted)
	

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

	/*_updateMove: function(delta) {
        var modifier = delta/1000;
        var oldX = this.hero.x;
        var oldY = this.hero.y;
        
		if (38 in this.keyDown) { // Player holding up
			this.hero.y -= Math.floor(this.hero.speed * modifier);
		}
		if (40 in this.keyDown) { // Player holding down
			this.hero.y += Math.floor(this.hero.speed * modifier);
		}
		if (37 in this.keyDown) { // Player holding left
			this.hero.x -= Math.floor(this.hero.speed * modifier);
		}
		if (39 in this.keyDown) { // Player holding right
			this.hero.x += Math.floor(this.hero.speed * modifier);
		}
	},*/

	/*_heroRender: function(){
		//set position
		this.hero_bitmap.x = this.hero.x;
		this.hero_bitmap.y = this.hero.y;

		console.log("hero bitmap x,y updated to ("+this.hero_bitmap.x+","+this.hero_bitmap.y+")");
	}*/
});