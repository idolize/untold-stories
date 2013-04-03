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
// send globals to the client when requested
app.get('/js/globals.js', function(req, res) {
    res.set('Content-Type', 'application/javascript');
    var globals = {
    	reqUrl: '/',
    	wsPort: isProduction ? 8000 : devPort // 8000 is hardcoded for OpenShift ws preview, see: https://www.openshift.com/blogs/paas-websockets
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
			// store the 'isCreator' value in the socket context itself to make it easier to determine
			player['isCreator'] = false;
			// notify any listeners
			this.emit('playerJoined');
			if (this.creator) {
				// both sides have joined
				this.inProgress = true;
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
				this.inProgress = true;
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
		this.inProgress = false;
	},
	removeCreator: function(creator) {
		delete creator['isCreator'];
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
		if (!success) {
			socket.emit('joinFailed', {msg: ('There is already a ' + (obj.isCreator ? 'creator' : 'player') + ' in the game.')});
		}
	});

	// register to the event we emitted in the gameServer
	gameServer.on('ready', function() {
		// tell all connected clients that the game server is ready
		io.sockets.emit('ready');
	});

	socket.on('turnEnded', function(changes) {
		// TODO store the number of turns, etc. here
		// send the event to the other player but no other connected clients
		var otherSocket = socket['isCreator'] ? gameServer.player : gameServer.creator;
		otherSocket.emit('yourTurn', changes);
	});

	// some client disconnected
	socket.on('disconnect', function() {
		if (socket['isCreator'] === true) {
			// if game is in progress send an error to the other player
			if (gameServer.inProgress) gameServer.player.emit('otherPlayerDisconnected');
			gameServer.removeCreator(socket);
		} else if (socket['isCreator'] === false) {
			// if game is in progress send an error to the other player
			if (gameServer.inProgress) gameServer.creator.emit('otherPlayerDisconnected');
			gameServer.removePlayer(socket);
		}
		// otherwise this was a disconnect from a client who was never actually in the game
	});

});

// start the server
server.listen(app.get('port'), isProduction ? prodIp : undefined);
