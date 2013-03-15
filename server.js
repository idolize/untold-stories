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

// start server
server.listen(8888);

// HTTP request for base page using express
app.get('/', function (req, res) {
	res.sendfile(__dirname + '/index.html');
});
app.get('/tileeditor.html', function (req, res) {
    res.sendfile(__dirname + '/tileeditor.html');
});

io.sockets.on('connection', function (socket) {
	socket.emit('init', { msg: ('Hi from node.js version '+process.versions.v8) });
});
