/**
 * Controls all socket connection and game creation/joining.
 * Does not perform any DOM manipulation.
 * @type {Class}
 */
var App = new Class({
	Implements: Events,
	Binds: ['onTurnStarted', 'endTurn', 'onOtherPlayerDisconnected', 'triggerPlace', 'triggerText', 'triggerAction', 'triggerDelete', 'triggerMoveBegin'], // see: http://mootools.net/docs/more/Class/Class.Binds

	socket: null,
	game: null,
	canvas: null,
	tileSize: 32, // tile size (either width or height b/c square) in pixels - update if image size changes
	actionMode: null,
	selectedObjOrTile: null,
	mouseHandler: null,

	initialize: function(canvas) {
		this.canvas = canvas;
		this.mouseHandler = new MouseHandler(this.canvas, this.tileSize);
	},

	/**
	 * Connects the client to the server.
	 * @param  {String} [serverUrl] The URL of the server to connect to. The default value is 'http://localhost:8888'.
	 */
	connect: function(serverUrl) {
		serverUrl = serverUrl || 'http://localhost:8888';
		this.socket = io.connect(serverUrl, {'force new connection':true}); // see https://github.com/LearnBoost/socket.io-client/issues/251
		this.socket.once('error', function() {
			console.log('ERROR: Unable to connect to socket');
			this.fireEvent('connectFailed');
		}.bind(this));
		this.socket.once('reconnect_error', function() {
			console.log('ERROR: Reconnect to socket failed');
			this.fireEvent('connectFailed');
		}.bind(this));
		this.socket.once('connect', function() {
			this.fireEvent('connected');
		}.bind(this));
	},

	playWithOtherPlayer: function(isCreator, username, otherPlayerUsername) {
		this.socket.emit('joinOther', {
			isCreator: isCreator,
			username: username,
			otherPlayerUsername: otherPlayerUsername
		});
		this._beginJoin(isCreator);
	},

	playMatchmaking: function(isCreator, username) {
		this.socket.emit('matchmakeMe', {
			isCreator: isCreator,
			username: username
		});
		this._beginJoin(isCreator);
	},

	/**
	 * Attempts to join the game.
	 * Fires either a 'joinFailed' or 'gameStarted' event depending on the result.
	 * @param {Boolean} isCreator Attempting to join as the creator or not.
	 * @param {String} username Username of the current player.
	 */
	_beginJoin: function(isCreator, username) {
		var onReady = function(otherPlayerUsername) {
			// no longer need to listen for 'joinFailed' messages
			this.socket.removeListener('joinFailed', onFail);
			// start the game and notify any listeners
			this.game = new Game(this.canvas, this.tileSize, isCreator, username, otherPlayerUsername);
			this.fireEvent('gameStarted', this.game);
			this.game.addEvent('turnStarted', this.onTurnStarted);
			this.game.start();
			// make the socket listen for 'yourTurn' events
			this.socket.on('yourTurn', this.game.beginTurn);
			// make the socket listen for 'otherPlayerDisconnected' events
			this.socket.once('otherPlayerDisconnected', this.onOtherPlayerDisconnected);
			// if our own socket disconnects
			this.socket.once('disconnect', function() {
				console.log('ERROR: Socket disconnected');
				this.fireEvent('disconnected');
			}.bind(this));
		}.bind(this); // Note: bind is needed to ensure the function is called with the right 'this' scoping
		var onFail = function(cause) {
			// update DOM elsewhere
			this.fireEvent('joinFailed', cause);
			this.destroy();
		}.bind(this);
		this.socket.once('joinFailed', onFail);
		this.socket.once('ready', onReady);
	},

	triggerPlace: function(pos) {
		if (instanceOf(this.selectedObjOrTile, TileType)) {
			this.game.placeTile(this.selectedObjOrTile, pos.x, pos.y);
		} else {
			this.game.placeObject(this.selectedObjOrTile, pos.x, pos.y);
		}
	},

	triggerText: function(pos) {
		this.fireEvent('textboxCreateRequest', pos);
	},

	triggerAction: function(pos) {
		this.fireEvent('actionCreateRequest', pos);
	},

	triggerDelete: function(pos) {
		this.game.deleteObjectByGlobalCoords(pos.x,pos.y);
	},

	triggerMoveBegin: function(pos) {
		var selectedObj = this.game.objectBoard.getObjectAtGlobalPosition(pos.x, pos.y);
		if (selectedObj) {
			var moveDragFunc = function(pos) {
				// preview the move location by moving around the bitmap
				selectedObj.bitmap.x = pos.x;
				selectedObj.bitmap.y = pos.y;
			}.bind(this);
			var moveEndedFunc = function(pos) {
				// snap to the nearest tile
				this.game.moveObject(selectedObj, pos.x, pos.y);
				// move completed
				this.mouseHandler.removeEvent('clickHoldCanvas', moveDragFunc);
				this.mouseHandler.removeEvent('clickReleasedBoard', moveEndedFunc);
			}.bind(this);
			this.mouseHandler.addEvent('clickHoldCanvas', moveDragFunc);
			this.mouseHandler.addEvent('clickReleasedBoard', moveEndedFunc);
		}
	},

	/**
	 * Sets the current tool or action for the interactions with the application.
	 * @param  {App.ActionMode}      mode               Enum value for which action mode to use.
	 * @param  {ObjectType|TileType} [objectOrTileType] The object or tile type to use if using the App.ActionMode.PLACE mode.
	 */
	setActionMode: function(mode, objectOrTileType) {
		this.mouseHandler.removeEvents();
		switch (mode) {
			case App.ActionMode.PLACE:
				this.selectedObjOrTile = objectOrTileType;
				// listen for mouse events
				this.mouseHandler.addEvent('clickBoard', this.triggerPlace);
				this.mouseHandler.addEvent('clickHoldBoard', this.triggerPlace);
				break;
			case App.ActionMode.TEXT:
				this.mouseHandler.addEvent('clickCanvas', this.triggerText);
				break;
			case App.ActionMode.ACTION:
				this.mouseHandler.addEvent('clickCanvas', this.triggerAction);
				break;
			case App.ActionMode.DELETE:
				this.mouseHandler.addEvent('clickCanvas', this.triggerDelete);
				break;
			case App.ActionMode.MOVE:
				this.mouseHandler.addEvent('clickCanvas', this.triggerMoveBegin);
				break;
			default:
				throw 'Unexpected action mode passed to App.setActionMode';
			}
	},

	/**
	 * Callback for when the game indicates a turn has started.
	 * @param  {Object} changes The new state changes received for this turn.
	 */
	onTurnStarted: function(changes) {
		this.mouseHandler.startListening();
		this.fireEvent('turnStarted');
	},

	/**
	 * Callback for if the other player in the game disconnects prematurely.
	 */
	onOtherPlayerDisconnected: function() {
		console.log('INFO: Other player disconnected');
		this.fireEvent('otherPlayerDisconnected');
		this.destroy();
	},

	/**
	 * Ends the current turn in the game and broadcasts the message to the server.
	 */
	endTurn: function() {
		this.mouseHandler.stopListening();
		var turnChanges = this.game.endTurn();
		this.socket.emit('turnEnded', turnChanges);
		this.fireEvent('turnEnded');
	},

	/**
	 * Immediately destroys the app.
	 */
	destroy: function() {
		// stop the mouse handler
		this.mouseHandler.stopListening();
		// remove all event listeners registered to this app
		this.removeEvents();
		// disconnect the socket
		this.socket.removeAllListeners();
		this.socket.disconnect();
		// end the game as well if it is running
		if (this.game && this.game.active) {
			this.game.endGame();
		}
	}
});

/** Enum used to indicate the current 'mode'. */
App.ActionMode = { PLACE: 1, EDIT: 2, DELETE: 3, MOVE: 4, TEXT: 5, ACTION: 6 };
