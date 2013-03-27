require('mootools');
var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);
app.set('view engine', 'ejs');
app.set('view options', {
	layout: false
});
app.set('port', process.env.NODE_ENV == 'production' ? process.env.OPENSHIFT_INTERNAL_PORT : 8888);
app.use(app.router);
app.use(express.static(__dirname + '/resources'));
app.configure('production', function() {
	// production-only settings for express
});
app.configure('development', function() {
	app.use(express.errorHandler({
		dumpExceptions: true, 
		showStack: true
	}));
});
var io = require('socket.io').listen(server);
io.configure('production', function() {
	io.enable('browser client etag');
	io.set('log level', 1);
	io.set('transports', ['websocket','xhr-polling','jsonp-polling']);
});
io.configure('development', function() {
	io.set('transports', ['websocket']);
});
// HTTP request for base page using express
app.get('/', function (req, res) {
	res.render('index', {
		url: (req.protocol + '://' + req.get('host') + req.url),
		wsPort: process.env.NODE_ENV == 'production' ? 8000 : app.get('port')
	});
});


/**
 * Any game logic the server needs to know about (should be relatively minimal).
 * @type {Class}
 */
var GameServer = new Class({
	Implements: [process.EventEmitter], //node.js event framework- faster than MooTools Events on server

	player: null,
	creator: null,

	initialize: function() {
		// Do something here?
	},
	attemptJoinPlayer: function(player) {
		if (!this.player) {
			// set reference
			this.player = player;
			// store the 'isCreator' value in the socket context itself to make it easier to determine
			player['isCreator'] = false;
			// notify any listeners
			this.emit('playerJoined');
			if (this.creator) {
				// both sides have joined
				this.emit('ready');
			}
			return true;
		} else {
			return false;
		}
	},
	attemptJoinCreator: function(creator) {
		if (!this.creator) {
			// set reference
			this.creator = creator;
			// store the 'isCreator' value in the socket context itself to make it easier to determine
			creator['isCreator'] = true;
			// notify any listeners
			this.emit('creatorJoined');
			if (this.player) {
				// both sides have joined
				this.emit('ready');
			}
			return true;
		} else {
			return false;
		}
	},
	removePlayer: function(player) {
		delete player['isCreator'];
		// player slot is now free
		this.player = null;
	},
	removeCreator: function(creator) {
		delete creator['isCreator'];
		// creator slot is now free
		this.creator = null;
	}
});


var gameServer = new GameServer();

io.sockets.on('connection', function (socket) {

	// some client is attempting to join the game
	socket.on('join', function(obj) {
		var success;
		if (obj.isCreator) {
			success = gameServer.attemptJoinCreator(socket);
		} else {
			success = gameServer.attemptJoinPlayer(socket);
		}
		if (!success) {
			socket.emit('joinFailed', {msg: ('There is already a ' + (obj.isCreator ? 'creator' : 'player') + ' in the game.')});
		}
	});

	// register to the event we emitted in the gameServer
	gameServer.on('ready', function() {
		// tell all connected clients that the game server is ready
		io.sockets.emit('ready');
	});

	// some client disconnected
	socket.on('disconnect', function() {
		if (socket['isCreator'] === true) {
			gameServer.removeCreator(socket);
			// TODO if game was in progress send an error to the other player
		} else if (socket['isCreator'] === false) {
			gameServer.removePlayer(socket);
			// TODO if game was in progress send an error to the other player
		}
		// otherwise this was a disconnect from a client who was never actually in the game
	});

});

// start the server
server.listen(app.get('port'), process.env.OPENSHIFT_INTERNAL_IP);