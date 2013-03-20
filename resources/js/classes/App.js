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
	 * @param  {String} [serverUrl] The URL of the server to connect to. The default value is 'http://localhost:8888'.
	 */
	connect: function(serverUrl) {
		serverUrl = serverUrl || 'http://localhost:8888';
		this.socket = io.connect(serverUrl);
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
		this.socket.once('joinFailed', function(cause) {
			// if failure
			this.socket.removeAllListeners('ready'); // no longer listen for ready events
			this.fireEvent('joinFailed', cause); // update DOM elsewhere
		}.bind(this)); // Note: bind is needed to ensure the function is called with the right 'this' scoping
		this.socket.once('ready', function() {
			// if success: start the game
			this.socket.removeAllListeners('joinFailed'); // no longer listen for joinFailed events
			this.game.start();
			this.fireEvent('gameStarted', this.game);
		}.bind(this));
	}
});