var isProduction = process.env.NODE_ENV == 'production';
var prodPort = process.env.OPENSHIFT_INTERNAL_PORT;
var prodIp = process.env.OPENSHIFT_INTERNAL_IP;
var devPort = 8888;

require('mootools');
var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);
app.set('view engine', 'ejs');
app.set('view options', {
	layout: false
});
app.set('port', isProduction ? prodPort : devPort);
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
	res.render('index');
});
var path = require('path');
var fs = require('fs');
// send globals to the client when requested
app.get('/js/globals.js', function(req, res) {
    res.set('Content-Type', 'application/javascript');
	var objectImgs = fs.readdirSync('resources/images/objects');
	var tileImgs = fs.readdirSync('resources/images/tiles');

	var stripIdFromPath = function(fullPath) {
		return path.basename(fullPath, '.png');
	}
	var onlyPngs = function(id) {
		return path.extname(id) == '.png';
	}

    var globals = {
    	reqUrl: '/',
    	wsPort: isProduction ? 8000 : devPort, // 8000 is hardcoded for OpenShift ws preview, see: https://www.openshift.com/blogs/paas-websockets
    	tileIds: tileImgs.filter(onlyPngs).map(stripIdFromPath),
    	objectIds: objectImgs.filter(onlyPngs).map(stripIdFromPath),
    	initialTileId: 'grass1'
    }
    res.send('var globals = ' + JSON.stringify(globals));
});
app.get('/tileeditor.html', function (req, res) {
    res.sendfile(__dirname + '/tileeditor.html');
});


/**
 * Any game logic the server needs to know about (should be relatively minimal).
 * @type {Class}
 */
var GameServer = new Class({
	Implements: [process.EventEmitter], //node.js event framework- faster than MooTools Events on server

	player: null,
	creator: null,
	inProgress: null,

	initialize: function() {
		this.reset();
	},
	reset: function() {
		this.player = this.creator = null;
		this.inProgress = false;
	},
	attemptJoinPlayer: function(player) {
		if (!this.player) {
			// set reference
			this.player = player;
			// notify any listeners
			this.emit('playerJoined');
			if (this.creator) {
				// both sides have joined
				this.inProgress = true;
				this.emit('started');
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
			// notify any listeners
			this.emit('creatorJoined');
			if (this.player) {
				// both sides have joined
				this.inProgress = true;
				this.emit('started');
			}
			return true;
		} else {
			return false;
		}
	},
	removePlayer: function(player) {
		// player slot is now free
		this.player = null;
		this.inProgress = false;
	},
	removeCreator: function(creator) {
		// creator slot is now free
		this.creator = null;
		this.inProgress = false;
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

		if (success) { // lobby joined but game not started yet
			var otherSocket = null;
			// register to the 'ready' event of gameServer
			var onGameStarted = function() {
				otherSocket = obj.isCreator ? gameServer.player : gameServer.creator;
				socket.emit('ready');
				// now the game is in progress so we listen for turn events
				socket.on('turnEnded', function(changes) {
					// TODO store the number of turns and other game stats here
					otherSocket.emit('yourTurn', changes);
				});
			};
			if (gameServer.inProgress) onGameStarted(); // we were the last player needed
			else gameServer.once('started', onGameStarted); // still need one more player
			// register for disconnected event of this client's socket
			socket.on('disconnect', function() {
				// if game is in progress send an error to the other player
				if (gameServer.inProgress) otherSocket.emit('otherPlayerDisconnected');
				gameServer.removeListener('started', onGameStarted);
				if (obj.isCreator) {
					gameServer.removeCreator(socket);
				} else {
					gameServer.removePlayer(socket);
				}
			});
		}
		else {
			socket.emit('joinFailed', {msg: ('There is already a ' + (obj.isCreator ? 'creator' : 'player') + ' in the game.')});
		}
	});
});

// start the server
server.listen(app.get('port'), isProduction ? prodIp : undefined);
