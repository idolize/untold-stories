/**
 * Controls all socket connection and game creation/joining.
 * Does not perform any DOM manipulation.
 * @type {Class}
 */
var App = new Class({
	Implements: Events,
	Binds: ['onTurnStarted', 'endTurn', 'onOtherPlayerDisconnected'], // see: http://mootools.net/docs/more/Class/Class.Binds

	socket: null,
	game: null,
	canvas: null,
	tileSize: 32, // tile size (either width or height b/c square) in pixels - update if image size changes

	initialize: function(canvas) {
		this.canvas = canvas;
	},

	/**
	 * Connects the client to the server.
	 * @param  {String} [serverUrl] The URL of the server to connect to. The default value is 'http://localhost:8888'.
	 */
	connect: function(serverUrl) {
		serverUrl = serverUrl || 'http://localhost:8888';
		if (!this.socket) {
			this.socket = io.connect(serverUrl);
		} else {
			this.socket = io.connect(serverUrl, {'force new connection':true}); // see https://github.com/LearnBoost/socket.io-client/issues/251
		}
		this.socket.once('error', function() {
			console.log('ERROR: Unable to connect to socket');
			this.fireEvent('connectFailed');
		}.bind(this));
		this.socket.once('reconnect_error', function() {
			console.log('ERROR: Reconnect to socket failed');
			this.fireEvent('connectFailed');
		}.bind(this));
		this.socket.once('disconnect', function() {
			console.log('ERROR: Socket disconnected');
			this.fireEvent('disconnected');
		}.bind(this));
		this.socket.once('connect', function() {
			this.fireEvent('connected');
		}.bind(this));
	},

	/**
	 * Attempts to join the game.
	 * Fires either a 'joinFailed' or 'gameStarted' event depending on the result.
	 * @param {Boolean} isCreator Attempting to join as the creator or not.
	 */
	join: function(isCreator) {
		this.game = new Game(this.canvas, this.tileSize, isCreator);
		this.socket.emit('join', {
			isCreator: this.game.isCreator,
			//TODO pass a username for this person?
			name: (this.game.isCreator ? 'creator' : 'player')
		});
		var onReady = function() {
			// no longer need to listen for 'joinFailed' messages
			this.socket.removeListener('joinFailed', onFail);
			// start the game and notify any listeners
			this.fireEvent('gameStarted', this.game);
			this.game.addEvent('turnStarted', this.onTurnStarted);
			this.game.start();
			// make the socket listen for 'yourTurn' events
			this.socket.on('yourTurn', this.game.beginTurn);
			// make the socket listen for 'otherPlayerDisconnected' events
			this.socket.once('otherPlayerDisconnected', this.onOtherPlayerDisconnected);
		}.bind(this); // Note: bind is needed to ensure the function is called with the right 'this' scoping
		var onFail = function(cause) {
			this.destroy();
			// update DOM elsewhere
			this.fireEvent('joinFailed', cause);
		}.bind(this);
		this.socket.once('joinFailed', onFail);
		this.socket.once('ready', onReady);
	},

	/**
	 * Callback for when the game indicates a turn has started.
	 * @param  {Object} changes The new state changes received for this turn.
	 */
	onTurnStarted: function(changes) {
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
		var turnChanges = this.game.endTurn();
		this.socket.emit('turnEnded', turnChanges);
		this.fireEvent('turnEnded');
	},

	/**
	 * Immediately destroys the app.
	 */
	destroy: function() {
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