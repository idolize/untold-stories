var $ = require('jquery');
var util = require('util');
var events = require('events');
var easeljs = require('easeljs');
var Hero = require('./Hero');
var Grid = require('../view/Grid');
var TileBoard = require('./TileBoard');
var ObjectBoard = require('./ObjectBoard');
var TileType = require('./TileType');
var ObjectType = require('./ObjectType');
var TextBox = require('./TextBox');

var heroImageUrl = 'images/hero/hero.png';


/**
 * Represents an actual game being played by a creator or player.
 * Does not handle any socket or DOM logic (other than the canvas);
 * that is done through event listeners.
 *
 * * @constructor
 * @param  {Stage}  stage    Game stage.
 * @param  {integer} tileSize The size of each tile (width and height are the same) in pixels. Should be a multiple of the canvas size.
 * @param  {Boolean} isCreator Is this game played by the creator?
 * @param  {String} username The username of the player playing this game instance.
 * @param  {String} otherPlayerUsername The username of the other player in the game.
 */
function Game(stage, tileSize, isCreator, username, otherPlayerUsername) {
  var canvas = stage.canvas;
  this.width = canvas.width;
  this.height = canvas.height;
  console.log('INFO: Canvas: ' + this.width + 'px x ' + this.height + 'px');
  this.stage = stage;
  this.tileSize = tileSize;
  this.isCreator = isCreator;
  this.username = username;
  this.otherPlayerUsername = otherPlayerUsername;
  this.active = false;
  this.objectTypeMap = {};
  this.tileTypeMap = {};
  this.creatorTextboxes = {};
  
  // create the tile board and add it to the display list
  var numWide = Math.floor(this.width / tileSize);
  var numHigh = Math.floor(this.height / tileSize);
  console.log('INFO: Tile board: ' + numWide + ' x ' + numHigh + ' tiles at tile size ' + tileSize + 'px');
  this.tileBoard = new TileBoard(numWide, numHigh, this.tileSize);
  // initialize scene
  this.tileBoard.setAllTilesToOneType(this.getTileTypeInstance(globals.initialTileId));
  this.stage.addChild(this.tileBoard.container);
  // create the object board and add it to the display list
  this.objectBoard = new ObjectBoard(numWide, numHigh, this.tileSize);
  this.stage.addChild(this.objectBoard.container);
  // create the grid
  this.grid = new Grid(this.tileBoard);
  // create the hero and add it to the display list
  this.hero = new Hero(heroImageUrl, 28, 32, 150, 150);
  this.stage.addChild(this.hero.bitmap);
  this.textboxesContainer = new easeljs.Container();
  this.stage.addChild(this.textboxesContainer);
}
util.inherits(Game, events.EventEmitter);
module.exports = Game;

/**
 * Starts the game.
 */
Game.prototype.start = function() {
  // initialize the state
  this.stateChanges = {
    'heroPosX': this.hero.x,
    'heroPosY': this.hero.y
  };
  this.emit('gameStarted');
  // the creator starts first
  if (this.isCreator) {
    // TODO this is just temporary to test object/tile placement. Will be replaced once tile selector GUI is done.
    // choose some arbitrary tile and object
    var grass1Type = new TileType('grass1', true);
    var tree1Type = new ObjectType('tree1', false);
    this.tileTypeMap['grass1'] = grass1Type;
    this.objectTypeMap['tree1'] = tree1Type;

    this.beginTurn(this.stateChanges);
  } else {
    // the player just waits
  }
  // loop to keep updating at each tick of the clock
  easeljs.Ticker.addEventListener('tick', this.gameLoop.bind(this));
};

Game.prototype.showGrid = function(show) {
  if (show) this.stage.addChildAt(this.grid.shape, 2);
  else this.stage.removeChild(this.grid.shape);
};

/**
 * Adds a new object to the game board or moves an existing object to a new location. Replaces an existing object if
 * placed at the same location as an existing object.
 * @param  {ObjectType|BoardObject} object The object to move or the type of new object to place.
 * @param  {integer} x                     The x board coordinate of where to place the object.
 * @param  {integer} y                     The y board coordinate of where to place the object.
 * @param  {Boolean} [onlyLocal]           Only locally for this turn (used to apply changes from another client).
 */
Game.prototype.placeObject = function(object, x, y, onlyLocal) {
  if (!this.active) throw 'Game method called while not in active turn';
  var objectType;
  if (instanceOf(object, ObjectType)) {
    this.objectBoard.setObject(x, y, object);
    objectType = object;
  } else {
    this.objectBoard.setObjectWithExisting(x, y, object, true);
    objectType = object.objType;
  }
  if (!onlyLocal) {
    if (!this.stateChanges['objsChanged']) this.stateChanges['objsChanged'] = {};
    // map on x,y to only store the last change at that location
    this.stateChanges['objsChanged'][x + ',' + y] = {
      id: objectType.id,
      x: x,
      y: y,
      isPassable: objectType.isPassable
    };
  }
};

/**
 * Used to reposition an object from one location to another.
 * Note: the change is recorded as a deletion and insertion at new location, so this function is not used
 * to reposition objects via the applyStateChanges method.
 * @param  {BoardObject} boardObject The object to move
 * @param  {integer}     newX        The new board position of the object.
 * @param  {integer}     newY        The new board position of the object.
 */
Game.prototype.moveObject = function(boardObject, newX, newY) {
  var oldCoords = { x: boardObject.objPosX, y: boardObject.objPosY };
  this.placeObject(boardObject, newX, newY);

  if (oldCoords.x != newX || oldCoords.y != newY) {
    // signal to delete any object at old location
    if (!this.stateChanges['objsChanged']) this.stateChanges['objsChanged'] = {};
    this.stateChanges['objsChanged'][oldCoords.x + ',' + oldCoords.y] = {
      id: null,
      x: oldCoords.x,
      y: oldCoords.y
    };
    // cleanup old location on board
    this.objectBoard.deleteObject(oldCoords.x, oldCoords.y, true);
  }
};

/**
 * Adds an tile to the game board or replaces an existing tile if placed at the same location as
 * an existing tile.
 * @param  {TileType} tileType The type of tile to place.
 * @param  {integer} x          The x board coordinate of where to place the tile.
 * @param  {integer} y          The y board coordinate of where to place the tile.
 * @param  {Boolean} [onlyLocal]  Only locally for this turn (used to apply changes from another client).
 */
Game.prototype.placeTile = function(tileType, x, y, onlyLocal) {
  if (!this.active) throw 'Game method called while not in active turn';
  this.tileBoard.setTile(x, y, tileType);
  if (!onlyLocal) {
    if (!this.stateChanges['tilesChanged']) this.stateChanges['tilesChanged'] = {};
    // map on x,y to only store the last change at that location
    this.stateChanges['tilesChanged'][x + ',' + y] = {
      id: tileType.id,
      x: x,
      y: y,
      isPassable: tileType.isPassable
    };
  }
};

/**
 * Moves the hero to a new (global) location.
 * @param  {integer} newX      The new cavas x coordinate of the hero.
 * @param  {integer} newY      The new canvas y coordinate of the hero.
 * @param  {Boolean} [onlyLocal]  Only locally for this turn (used to apply changes from another client).
 */
Game.prototype.moveHero = function(newX, newY, onlyLocal) {
  if (!this.active) throw 'Game method called while not in active turn';
  this.hero.x = newX;
  this.hero.y = newY;
  if (!onlyLocal) {
    this.stateChanges['heroPosX'] = this.hero.x;
    this.stateChanges['heroPosY'] = this.hero.y;
  }
};

/**
 * Deletes an object using global (canvas) coordinates rather than local (board) coordinates.
 * The coordinates can be anywhere on the object. Note that this method always records the change
 * in the state changes.
 * @param  {integer} x The global x coorindate of the desired deletion.
 * @param  {integer} y The global y coordinate of the desired deletion.
 * @return {Boolean}   If an object was actually deleted.
 */
Game.prototype.deleteObjectByGlobalCoords = function(x, y) {
  var boardObj = this.objectBoard.getObjectAtGlobalPosition(x, y);
  if (boardObj) {
    this.deleteObject(boardObj.objPosX, boardObj.objPosY, false);
    return true;
  } else return false;
};

/**
 * Deleted an object at the given board location.
 * @param  {integer} x         The board-local x coordinate of the object to delte.
 * @param  {integer} y         The board-local y coordinate of the object to delete.
 * @param  {Boolean} [onlyLocal]  Only locally for this turn (used to apply changes from another client).
 */
Game.prototype.deleteObject = function(x, y, onlyLocal) {
  if (!this.active) throw 'Game method called while not in active turn';
  this.objectBoard.deleteObject(x, y);
  console.log('INFO: Deleted object at: ', x, ',', y);
  if (!onlyLocal) {
    // check if this is a message that has been committed yet or not
    if (this.stateChanges['objsChagned'] && this.stateChanges['objsChagned'][x + ',' + y]) {
      this.stateChanges['objsChagned'][x + ',' + y].id = null;
    } else {
      if (!this.stateChanges['objsChanged']) this.stateChanges['objsChanged'] = {};
      this.stateChanges['objsChanged'][x + ',' + y] = {
        id: null,
        x: x,
        y: y
      };
    }
  }
};

/**
 * Adds a textbox to the game. If the Player is calling this method after they have already placed their textbox
 * then it is moved rather than adding a new textbox.
 * @param {DOMElement}  element    The DOM element used to represent this text box.
 * @param {String}  text       The text content of the text box.
 * @param {integer}  x          The global (canvas) x coordinate of the text box.
 * @param {[type]}  y          The global (canvas) y coordinate of the text box.
 * @param {Boolean} isCreators If this textbox belongs to the creator or not.
 * @param {Boolean}  [onlyLocal]  Only locally for this turn (used to apply changes from another client).
 */
Game.prototype.addTextbox = function(element, text, x, y, isCreators, onlyLocal) {
  if (!onlyLocal && !this.active) throw 'Game method called while not in active turn';
  if (!isCreators && this.playerTextbox) return; // TODO move existing box

  var textbox = new TextBox(element, text, x, y, false);
  this.textboxesContainer.addChild(textbox.domElement);
  if (isCreators) {
    this.creatorTextboxes[x + ',' + y] = textbox;
  } else {
    this.playerTextbox = textbox;
  }
  this.stage.update();

  if (!onlyLocal) {
    if (!this.stateChanges['textboxesAdded']) this.stateChanges['textboxesAdded'] = {};
    this.stateChanges['textboxesAdded'][x + ',' + y] = { text: text, x: x, y: y };
  }
};

/**
 * Only called during the same turn to remove a textbox the player/creator decides they don't want anymore.
 * Not needed between turns because textboxes automatically clear.
 * @param  {integer} x The x coordinate of the textbox being removed.
 * @param  {integer} y The y coordinate of the textbox being removed.
 * @param {Boolean} isCreators If this textbox belongs to the creator or not.
 * @param {Boolean}  [onlyLocal]  Only locally for this turn (used to apply changes from another client).
 */
Game.prototype.removeTextbox = function(x, y, isCreators, onlyLocal) {
  if (!this.active) throw 'Game method called while not in active turn';
  var textbox;
  if (isCreators) {
    textbox = this.creatorTextboxes[x + ',' + y];
    delete this.creatorTextboxes[x + ',' + y];
  } else {
    textbox = this.playerTextbox;
    this.playerTextbox = null;
  }
  this.textboxesContainer.removeChild(textbox.domElement);
  $(textbox.domElement.htmlElement).remove();
  if (!onlyLocal) {
    if (this.stateChanges['textboxesAdded'] && this.stateChanges['textboxesAdded'][x + ',' + y]) {
      delete this.stateChanges['textboxesAdded'][x + ',' + y];
      if (Object.keys(this.stateChanges['textboxesAdded']).length == 0) delete this.stateChanges['textboxesAdded'];
    }
  }
};

/**
 * Places an action at the given location if an action does not currently exist.
 * If an action already exists then it is moved to the new location.
 * @param {DOMElement}  element    The DOM element used to represent this action box.
 * @param {String}  text       The action content of the action box.
 * @param {integer}  x          The global (canvas) x coordinate of the action box.
 * @param {[type]}  y          The global (canvas) y coordinate of the action box.
 * @param {Boolean}  [onlyLocal]  Only locally for this turn (used to apply changes from another client).
 */
Game.prototype.placeAction = function(element, text, x, y, onlyLocal) {
  if (!this.active) throw 'Game method called while not in active turn';
  if (this.actionBox) return; // TODO move existing box

  this.actionBox = new TextBox(element, text, x, y, true);
  this.stage.addChild(this.actionBox.domElement);
  this.stage.update();

  if (!onlyLocal) {
    this.stateChanges['actionPlaced'] = { text: text, x: x, y: y };
  }
};

/**
 * Removes the player action if it exists. This method is only needed/used by the Player
 * to delete an action placed in the same turn.
 */
Game.prototype.removeAction = function() {
  if (!this.active) throw 'Game method called while not in active turn';
  this.textboxesContainer.removeChild(actionBox.domElement);
  $(this.actionBox.domElement.htmlElement).remove();
  this.actionBox = null;
  if (this.stateChanges['actionPlaced']) {
    delete this.stateChanges['actionPlaced'];
  }
};

/**
 * Clears any existing textboxes and action created by player and creator.
 * These changes are only local and do not get saved in the state changes or sent to the other client on turn
 * end.
 */
Game.prototype.clearTextboxes = function() {
  Object.each(this.creatorTextboxes, function(textbox, key) {
    $(textbox.domElement.htmlElement).remove();
  }, this);
  this.textboxesContainer.removeAllChildren();
  this.creatorTextboxes = {};
  if (this.playerTextbox) {
    $(this.playerTextbox.domElement.htmlElement).remove();
    this.stage.removeChild(this.playerTextbox.domElement);
    this.playerTextbox = null;
  }
  if (this.actionBox) {
    $(this.actionBox.domElement.htmlElement).remove();
    this.stage.removeChild(this.actionBox.domElement);
    this.actionBox = null;
  }
};

/**
 * Clears all objects and tiles from the screen.
 * @param {boolean} [onlyLocal] Only clear the screen locally for this turn (used to apply changes from another client).
 */
Game.prototype.clearScreen = function(onlyLocal) {
  this.tileBoard.clearBoard();
  this.objectBoard.clearBoard();
  if (!onlyLocal) {
    this.stateChanges['cleared'] = true;
    this.stateChanges['tilesChanged'] = {};
    this.stateChanges['objsChanged'] = {};
  }
};

/**
 * Updates the state of the game and all game objects based on a set of changes.
 * @param {Object} changes The new game state changes.
 */
Game.prototype.applyStateChanges = function(changes) {
  // if scene cleared
  if (changes['cleared']) {
    this.clearScreen(true);
  }
  if (changes['textboxesAdded']) {
    var textAdded = changes['textboxesAdded'];
    Object.each(textAdded, function(textbox, key) {
      this.emit('constructTextboxFromOtherClient', textbox);
    }, this);
  }
  if (changes['actionPlaced']) {
    this.emit('constructActionFromOtherClient', changes['actionPlaced']);
  }
  // update objects
  if (changes['objsChanged']) {
    var objsChanged = changes['objsChanged'];
    Object.each(objsChanged, function(obj, key) {
      if (obj.id == null) { // delete the object
        this.deleteObject(obj.x, obj.y, true);
      } else {
        // add new object to the board
        this.placeObject(this.getObjectTypeInstance(obj.id), obj.x, obj.y, true);
      }
    }, this);
  }
  // TODO handle object deletion or object movement
  // update tiles
  if (changes['tilesChanged']) {
    var tilesChanged = changes['tilesChanged'];
    Object.each(tilesChanged, function(tile, key) {
      // set new tiles on the board
      this.placeTile(this.getTileTypeInstance(tile.id), tile.x, tile.y, true);
    }, this);
  }

  // update the hero position
  if (changes['heroPosX']) this.hero.x = changes['heroPosX'];
  if (changes['heroPosY']) this.hero.y = changes['heroPosY'];
};

/**
 * Begins a new turn.
 * @param  {Object} changes The new state changes to apply at the beginning of this turn.
 */
Game.prototype.beginTurn = function(changes) {
  if (!this.active) {
    console.log('INFO: Turn started');
    this.active = true;

    // reset record of changes for this turn
    this.stateChanges = {};

    // clear the textboxes/action from the last turn
    this.clearTextboxes();

    // (re)initialize the state
    this.applyStateChanges(changes);

    this.numTextboxesByMe = 0;
    this.emit('turnStarted', changes);
  }
};

/**
 * Ends the active turn.
 * @return {Object} The current state object for the game.
 */
Game.prototype.endTurn = function() {
  if (this.active) {
    // turn is now over
    console.log('INFO: Turn ended');
    this.active = false;
  }
  this.emit('turnEnded', this.stateChanges); // not used currently - just in case someone cares to listen
  return this.stateChanges;
};


/**
 * Ends the game.
 */
Game.prototype.endGame = function() {
  // force any active turn to end
  if (this.active) this.endTurn();
  // stop game timer
  easeljs.Ticker.removeEventListener('tick', this.gameLoop);
  this.emit('gameOver');
};

/**
 * Called at each frame update.
 * @param  {Object} event Event object.
 * @see  <a href="http://www.createjs.com/Docs/EaselJS/classes/Ticker.html#event_tick">Event payload</a>
 */
Game.prototype.gameLoop = function(event) {
  // update the game logic

  // TODO collision checking goes here

  // render
  this.hero.render();
  this.stage.update();
};

/**
 * Gets the existing tile type from the map by id if it exists, if not a new instance is created, added to the map,
 * and returned.
 * @param  {String} tileId The id for the tile.
 * @return {TileType} The associated tile type.
 */
Game.prototype.getTileTypeInstance = function(tileId) {
  var entry = this.tileTypeMap[tileId];
  if (!entry) {
    entry = new TileType(tileId, true); //TODO handle isPassable
    this.tileTypeMap[tileId] = entry;
  }
  return entry;
};

/**
 * Gets the existing object type from the map by id if it exists, if not a new instance is created, added to the map,
 * and returned.
 * @param  {String} objectId The id for the object.
 * @return {ObjectType} The associated object type.
 */
Game.prototype.getObjectTypeInstance = function(objectId) {
  var entry = this.objectTypeMap[objectId];
  if (!entry) {
    entry = new ObjectType(objectId, true); //TODO handle isPassable
    this.objectTypeMap[objectId] = entry;
  }
  return entry;
};
