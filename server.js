require('mootools');
var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server, {
	transports: ['websocket']
});
app.configure(function(){
	app.use(express.methodOverride());
	app.use(express.bodyParser());
	app.use(express.static(__dirname + '/resources'));
	app.use(express.errorHandler({
		dumpExceptions: true, 
		showStack: true
	}));
	app.use(app.router);
});
// HTTP request for base page using express
app.get('/', function (req, res) {
	res.sendfile(__dirname + '/index.html');
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
			delete socket['isCreator'];
			// creator slot is now free
			gameServer.creator = null;
			// TODO end the game or show error message?
		} else if (socket['isCreator'] === false) {
			delete socket['isCreator'];
			// player slot is now free
			gameServer.player = null;
			// TODO end the game or show error message?
		}
	});

});


// start the server
server.listen(8888);