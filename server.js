var isProduction = process.env.NODE_ENV === 'production';
var prodPort = process.env.OPENSHIFT_INTERNAL_PORT;
var prodIp = process.env.OPENSHIFT_INTERNAL_IP;
var devPort = 8888;

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
if (!isProduction) {
	app.get('/player', function (req, res) {
		res.render('index', { autojoin: 'player' });
	});
	app.get('/creator', function (req, res) {
		res.render('index', { autojoin: 'creator' });
	});
}
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
		return path.extname(id) === '.png';
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

var gameServer = require('./gameserver');

io.sockets.on('connection', function (socket) {
	// all further socket communication/management is handled by the game server
	socket.on('matchmakeMe', function(obj) {
		gameServer.findOpenRoom(socket, obj.username, obj.isCreator);
	});
	socket.on('joinOther', function(obj) {
		gameServer.joinRoom(socket, obj.username, obj.isCreator, obj.otherPlayerUsername);
	});
});

// start the server
server.listen(app.get('port'), isProduction ? prodIp : undefined);
