/**
 * Controls all socket connection and game creation/joining.
 * Does not perform any DOM manipulation.
 * @type {Class}
 */
var App = new Class({
	Implements: Events,

	socket : null,
	isCreator : null,
	game : null,

	initialize: function(canvas, isCreator) {
		this.isCreator = isCreator;
		this.game = new Game(canvas, isCreator);
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
		this.socket.emit('join', {
			isCreator: this.isCreator,
			//TODO pass a username for this person?
			name: (this.isCreator ? 'creator' : 'player')
		});
		var onReady = function() {
			// no longer need to listen for 'joinFailed' messages
			this.socket.removeListener('joinFailed', onFail);
			// start the game and notify any listeners
			this.game.start();
			this.fireEvent('gameStarted', this.game);
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

	/**
	 * Immediately destroys the app.
	 */
	destroy: function() {
		// remove all event listeners registered to this app
		this.removeEvents();
		// disconnect the socket
		this.socket.removeAllListeners();
		this.socket.disconnect();
		// TODO end the game as well if it is running
	}
});