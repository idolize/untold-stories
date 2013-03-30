/**
 * Controls all socket connection and game creation/joining.
 * Does not perform any DOM manipulation.
 * @type {Class}
 */
var App = new Class({
	Implements: Events,
	Binds: ['onTurnStarted', 'endTurn'], // see: http://mootools.net/docs/more/Class/Class.Binds

	socket: null,
	isCreator: null,
	game: null,

	initialize: function(canvas, isCreator) {
		this.isCreator = isCreator;

		var tileSize = 20; // tile size (either width or height b/c square) in pixels - update if image size changes

		this.game = new Game(canvas, tileSize, isCreator);
	},

	/**
	 * Connects the client to the server.
	 * @param {Boolean} [isReconnect] If this is not the first time the socket has been connected then this must be true. Defaults to false.
	 * @param  {String} [serverUrl] The URL of the server to connect to. The default value is 'http://localhost:8888'.
	 */
	connect: function(isReconnect, serverUrl) {
		serverUrl = serverUrl || 'http://localhost:8888';
		this.socket = io.connect(serverUrl);
		if (isReconnect) {
			this.socket.socket.reconnect(); // see http://stackoverflow.com/questions/9598900/how-to-reconnect-after-you-called-disconnect
		}
	},

	/**
	 * Attempts to join the game.
	 * Fires either a 'joinFailed' or 'gameStarted' event depending on the result.
	 */
	join: function() {
		console.log('App.join called');
		this.socket.emit('join', {
			isCreator: this.isCreator,
			//TODO pass a username for this person?
			name: (this.isCreator ? 'creator' : 'player')
		});
		var onReady = function() {
			// no longer need to listen for 'joinFailed' messages
			this.socket.removeListener('joinFailed', onFail);
			// start the game and notify any listeners
			this.fireEvent('gameStarted', this);
			this.game.addEvent('turnStarted', this.onTurnStarted);
			this.game.start();
			// make the socket listen for 'yourTurn' events
			this.socket.on('yourTurn', this.game.beginTurn);
		}.bind(this); // Note: bind is needed to ensure the function is called with the right 'this' scoping
		var onFail = function(cause) {
			// no longer listen for any messages until the app is recreated
			this.socket.removeAllListeners();
			// update DOM elsewhere
			this.fireEvent('joinFailed', cause);
		}.bind(this);
		this.socket.once('joinFailed', onFail);
		this.socket.once('ready', onReady);
	},

	onTurnStarted: function(newState) {
		console.log('App.onTurnStarted called. newState:');
		console.log(newState);
		this.fireEvent('turnStarted');
	},

	endTurn: function() {
		console.log('App.endTurn called');
		var currentState = this.game.endTurn();
		this.socket.emit('yourTurn', currentState);
		console.log('"yourTurn" emit called');
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
		if (this.game.active) {
			this.game.stop();
		}
	}
});