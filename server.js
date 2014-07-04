var path = require('path');
var fs = require('fs');
var express = require('express');
var http = require('http');
var socketio = require('socket.io');
var errorhandler = require('errorhandler');
var browserify = require('browserify-middleware');

var isProduction = process.env.NODE_ENV === 'production';
var prodPort = process.env.OPENSHIFT_NODEJS_PORT;
var prodIp = process.env.OPENSHIFT_NODEJS_IP;
var devPort = 8887;

var app = express();
var server = http.createServer(app);

app.set('view engine', 'ejs');
app.set('view options', {
  layout: false
});
app.set('port', isProduction ? prodPort : devPort);

var socketOpts = {};
if (!isProduction) {
  app.use(errorhandler({
    dumpExceptions: true, 
    showStack: true
  }));
}
var io = socketio(server, socketOpts);


app.use(express.static(__dirname + '/public'));
app.get('/js/client.js', browserify('./client/client.js'));
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
app.get('/styles/external/introjs.css', function (req, res) {
  res.sendfile('./node_modules/intro.js/introjs.css');
});

// send globals to the client when requested
app.get('/js/globals.js', function(req, res) {
  res.set('Content-Type', 'application/javascript');
  var objectImgs = fs.readdirSync('public/images/objects');
  var tileImgs = fs.readdirSync('public/images/tiles');

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

var gameServer = require('./gameserver');

io.on('connection', function (socket) {
  // all further socket communication/management is handled by the game server
  socket.on('matchmakeMe', function(args) {
    gameServer.findOpenRoom(socket, args.username, args.isCreator);
  });
  socket.on('joinOther', function(args) {
    gameServer.joinRoom(socket, args.username, args.isCreator, args.otherPlayerUsername);
  });
});

// start the server
server.listen(app.get('port'), isProduction ? prodIp : undefined);
console.log("Server listening in " + (isProduction ? "production" : "development") + " mode on port " + app.get('port'));