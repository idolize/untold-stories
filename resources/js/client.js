function loaded() {
	/*
	 * test Socket.io
	 */

	var msgLocation = document.getElementById('servermsg');
	var socket = io.connect('http://localhost:8888');
	// callback from server
	socket.on('init', function (data) {
		console.log(data);
		// set p tag to message
		msgLocation.innerHTML = data.msg;
		// disconnect socket
		socket.disconnect();
		console.log('Socket.io test done');
	});

	/*
	 * test EaselJS
	 */

	// create a stage by getting a reference to the canvas
	stage = new createjs.Stage('gamecanvas');
	// load images from server`
	var image1 = new Image();
	image1.src = 'http://localhost:8888/images/1.png';
	var image2 = new Image();
	image2.src = 'http://localhost:8888/images/2.png';
	// create the tile types for these images
	var type1 = new TileType(1, image1);
	var type2 = new TileType(2, image2);
	// create the board and display it
	var board = new Board(20, 15, 20);
	stage.addChild(board.container);

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

	// render loop to keep updating with any changes to the display list
	createjs.Ticker.addEventListener('tick', handleTick);
	function handleTick(event) {
		stage.update();
	}
}
window.addEvent('domready', loaded); // call when everything has loaded