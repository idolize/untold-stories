var util = require('util');
var io = require('socket.io-client');
var events = require('events');
var easeljs = require('easeljs');
var MouseHandler = require('./MouseHandler');
var ActionMode = require('../model/ActionModeEnum');
var TileType = require('../model/TileType');
var ObjectType = require('../model/ObjectType');
var Game = require('../model/Game');
var Turn = require('../model/Turn');

var tileSize = 32; // tile size (either width or height b/c square) in pixels - update if image size changes

/**
 * Controls all socket connection and game creation/joining.
 * Does not perform any DOM manipulation.
 *
 * @constructor
 * @param {HTMLCanvas} canvas  The jQuery selector for the canvas element.
 */
function UntoldStories(canvas) {
  this.stage = new easeljs.Stage(canvas[0]);
  this.tileSize = tileSize;

  this.mouseHandler = new MouseHandler(this.stage, this.tileSize);
}
util.inherits(UntoldStories, events.EventEmitter);
module.exports = UntoldStories;

/**
 * Connects the client to the server.
 * @param  {String} [serverUrl] The URL of the server to connect to. The default value is 'http://localhost:8887'.
 */
UntoldStories.prototype.connect = function(serverUrl) {
  serverUrl = serverUrl || 'http://localhost:8887';
  this.socket = io(serverUrl);

  this.socket.once('error', function(errorData) {
    console.log('ERROR: Unable to connect to socket', errorData);
    this.emit('connectFailed');
  }.bind(this));

  this.socket.once('reconnect_failed', function() {
    console.log('ERROR: Reconnect to socket failed');
    this.emit('connectFailed');
  }.bind(this));

  this.socket.once('connect', function() {
    this.emit('connected');
  }.bind(this));
};

UntoldStories.prototype.playWithOtherPlayer = function(isCreator, username, otherPlayerUsername) {
  this.socket.emit('joinOther', {
    isCreator: isCreator,
    username: username,
    otherPlayerUsername: otherPlayerUsername
  });

  beginJoin.call(this, isCreator);
};

UntoldStories.prototype.playMatchmaking = function(isCreator, username) {
  this.socket.emit('matchmakeMe', {
    isCreator: isCreator,
    username: username
  });

  beginJoin.call(this, isCreator);
};

/**
 * Attempts to join the game.
 * Fires either a 'joinFailed' or 'gameStarted' event depending on the result.
 * @param {Boolean} isCreator Attempting to join as the creator or not.
 * @param {String} username Username of the current player.
 */
function beginJoin (isCreator, username) {
  var onReady = function(otherPlayerUsername) {
    // no longer need to listen for 'joinFailed' messages
    this.socket.removeListener('joinFailed', onFail);
    // start the game and notify any listeners
    this.game = new Game(this.stage, this.tileSize, isCreator, username, otherPlayerUsername);
    this.emit('gameStarted', this.game);
    this.game.on('turnStarted', onTurnStarted.bind(this));
    this.game.start();
    // make the socket listen for 'yourTurn' events
    this.socket.on('yourTurn', function (lastTurnJson) {
      var lastTurn = Turn.fromJSON(lastTurnJson, this.game.commands);
      this.game.nextTurn.call(this.game, lastTurn);
    }.bind(this));
    // make the socket listen for 'otherPlayerDisconnected' events
    this.socket.once('otherPlayerDisconnected', onOtherPlayerDisconnected.bind(this));
    // if our own socket disconnects
    this.socket.once('disconnect', function() {
      console.log('ERROR: Socket disconnected');
      this.emit('disconnected');
    }.bind(this));
  }.bind(this);

  var onFail = function(cause) {
    // update DOM elsewhere
    this.emit('joinFailed', cause);
    this.destroy();
  }.bind(this);

  this.socket.once('joinFailed', onFail);
  this.socket.once('ready', onReady);
}

function triggerPlace(pos) {
  var placeAction;
  if (this.selectedObjOrTile instanceof TileType) {
    placeAction = new this.game.commands.PlaceTile(this.selectedObjOrTile, pos.x, pos.y);
  } else {
    placeAction = new this.game.commands.PlaceObject(this.selectedObjOrTile, pos.x, pos.y);
  }
  this.game.executeCommand(placeAction);
}

function triggerText(pos) {
  this.emit('textboxCreateRequest', pos);
}

function triggerAction(pos) {
  this.emit('actionCreateRequest', pos);
}

function triggerDelete(pos) {
  var boardObj = this.game.objectBoard.getObjectAtGlobalPosition(pos.x, pos.y);
  if (boardObj) {
    this.game.executeCommand('DeleteObject', boardObj.x, boardObj.y);
  }
}

function triggerDeleteTextbox(e) {
  // click event
  var textbox = e.data;
  if (e.data.isAction) {
    this.game.executeCommand('RemoveAction');
  } else {
    this.game.executeCommand('RemoveTextbox', textbox.id, this.game.isCreator);
  }
}

function triggerMoveBegin(pos) {
  // handle hero move
  var hero = this.game.hero;
  var localPos = hero.bitmap.globalToLocal(pos.x, pos.y);
  if (hero.bitmap.hitTest(localPos.x, localPos.y)) {
    var heroMoveFunc = function(event) {
      var newX = Math.round(event.stageX - (hero.width / 2));
      var newY = Math.round(event.stageY - (hero.height / 2));
      hero.x = newX;
      hero.y = newY;
    }.bind(this);
    
    var heroMoveEndedFunc = function(event) {
      this.game.executeCommand('MoveHero', hero.x, hero.y);
      hero.bitmap.off('pressmove', heroMoveFunc);
    };

    hero.bitmap.addEventListener('pressmove', heroMoveFunc);
    hero.bitmap.on('pressup', heroMoveEndedFunc, this, true); // see: http://www.createjs.com/Docs/EaselJS/classes/EventDispatcher.html#method_on
    return;
  }
  if (!this.game.isCreator) return;

  // handle non-hero objects
  var selectedObj = this.game.objectBoard.getObjectAtGlobalPosition(pos.x, pos.y);
  if (selectedObj) {
    this.game.objectBoard.container.setChildIndex(selectedObj.bitmap, this.game.objectBoard.container.children.length - 1);
    var moveDragFunc = function(event) {
      // preview the move location by moving around the bitmap
      var boardX = Math.floor(event.stageX / tileSize);
      var boardY = Math.floor(event.stageY / tileSize);
      event.target.x = boardX * tileSize;
      event.target.y = boardY * tileSize;
    }.bind(this);

    var moveEndedFunc = function(event) {
      //snap to the nearest tile
      var boardX = Math.floor(event.stageX / tileSize);
      var boardY = Math.floor(event.stageY / tileSize);

      this.game.executeCommand('MoveObject', selectedObj.x, selectedObj.y, boardX, boardY);
      // move completed
      event.target.off('pressmove', moveDragFunc);
    };

    selectedObj.bitmap.addEventListener('pressmove', moveDragFunc);
    selectedObj.bitmap.on('pressup', moveEndedFunc, this, true);
  }
}

/**
 * TODO: Move this to the client.js file instead?
 * Makes the textboxes draggable to the user.
 * @param {Boolean} isDraggable If the textboxes should be draggable or not.
 */
UntoldStories.prototype.setTextboxesAsDraggable = function(isDraggable) {
  for (var textboxId in this.game.creatorTextboxes) {
    this.game.creatorTextboxes[textboxId].setDraggable(this.game.isCreator && isDraggable);
  }
  if (this.game.actionBox) this.game.actionBox.setDraggable(!this.game.isCreator && isDraggable);
  if (this.game.playerTextbox) this.game.playerTextbox.setDraggable(!this.game.isCreator && isDraggable);
};

/**
 * TODO: Move this to the client.js file instead?
 * Makes the textboxes removable to the user.
 * @param {Boolean} isRemovable If the textboxes should be removable or not.
 */
UntoldStories.prototype.setTextboxesAsRemovable = function(isRemovable) {
  if (!isRemovable) {
    for (var textboxId in this.game.creatorTextboxes) {
      var textbox = this.game.creatorTextboxes[textboxId];
      console.log('textbox', textbox);
      textbox.domNode.off('click');
    }
    if (this.game.actionBox) this.game.actionBox.domNode.off('click');
    if (this.game.playerTextbox) this.game.playerTextbox.domNode.off('click');
    return;
  }

  if (this.game.isCreator) {
    for (var textboxId in this.game.creatorTextboxes) {
      var textbox = this.game.creatorTextboxes[textboxId];
      textbox.domNode.on('click', null, textbox, triggerDeleteTextbox.bind(this));
    }
  } else {
    if (this.game.actionBox) this.game.actionBox.domNode.on('click', null, this.game.actionBox, triggerDeleteTextbox.bind(this));
    if (this.game.playerTextbox) this.game.playerTextbox.domNode.on('click', null, this.game.playerTextbox, triggerDeleteTextbox.bind(this));
  }
};

/**
 * Sets the current tool or action for the interactions with the application.
 * @param  {ActionMode}      mode               Enum value for which action mode to use.
 * @param  {ObjectType|TileType} [objectOrTileType] The object or tile type to use if using the UntoldStories.ActionMode.PLACE mode.
 */
UntoldStories.prototype.setActionMode = function(mode, objectOrTileType) {
  this.mouseHandler.removeAllListeners();
  this.setTextboxesAsDraggable(false);
  this.setTextboxesAsRemovable(false);
  switch (mode) {
    case ActionMode.PLACE:
      this.selectedObjOrTile = objectOrTileType;
      // listen for mouse events
      var triggerPlaceBound = triggerPlace.bind(this);
      this.mouseHandler.on('clickBoard', triggerPlaceBound);
      this.mouseHandler.on('clickHoldBoard', triggerPlaceBound);
      break;
    case ActionMode.TEXT:
      this.mouseHandler.on('clickCanvas', triggerText.bind(this));
      break;
    case ActionMode.ACTION:
      this.mouseHandler.on('clickCanvas', triggerAction.bind(this));
      break;
    case ActionMode.DELETE:
      this.setTextboxesAsRemovable(true);
      this.mouseHandler.on('clickCanvas', triggerDelete.bind(this));
      break;
    case ActionMode.MOVE:
      this.setTextboxesAsDraggable(true);
      this.mouseHandler.on('clickCanvas', triggerMoveBegin.bind(this));
      break;
    default:
      throw 'Unexpected action mode passed to UntoldStories.setActionMode';
  }
  this.actionMode = mode;
};

/**
 * Callback for when the game indicates a turn has started.
 * @param  {Object} changes The new state changes received for this turn.
 */
function onTurnStarted(changes) {
  if (this.actionMode === ActionMode.MOVE) this.setTextboxesAsDraggable(true);
  else if (this.actionMode === ActionMode.DELETE) this.setTextboxesAsRemovable(true);
  this.mouseHandler.startListening();
  this.emit('turnStarted');
}

/**
 * Callback for if the other player in the game disconnects prematurely.
 */
function onOtherPlayerDisconnected() {
  console.log('INFO: Other player disconnected');
  this.emit('otherPlayerDisconnected');
  this.destroy();
}

/**
 * Ends the current turn in the game and broadcasts the message to the server.
 */
UntoldStories.prototype.endTurn = function() {
  this.mouseHandler.stopListening();
  this.setTextboxesAsDraggable(false);
  this.setTextboxesAsRemovable(false);
  var turnChanges = this.game.endTurn();
  this.socket.emit('turnEnded', turnChanges);
  this.emit('turnEnded');
};

/**
 * Immediately destroys the app.
 */
UntoldStories.prototype.destroy = function() {
  // stop the mouse handler
  this.mouseHandler.stopListening();
  // remove all event listeners registered to this app
  this.removeAllListeners();
  this.setTextboxesAsDraggable(false);
  this.setTextboxesAsRemovable(false);
  // disconnect the socket
  this.socket.removeAllListeners();
  this.socket.disconnect();
  // end the game as well if it is running
  if (this.game && this.game.active) {
    this.game.endGame();
  }
};