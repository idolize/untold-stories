var util = require('util');
var events = require('events');
var easeljs = require('easeljs');
var commands = require('./commands');
var Hero = require('./Hero');
var Grid = require('../view/Grid');
var Turn = require('./Turn');
var TileBoard = require('./TileBoard');
var ObjectBoard = require('./ObjectBoard');
var TileType = require('./TileType');
var ObjectType = require('./ObjectType');


var heroImageUrl = 'images/hero/hero.png';


/**
 * Represents an actual game being played by a creator or player.
 * Does not handle any socket or DOM logic (other than the canvas);
 * that is done through event listeners.
 *
 * @constructor
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
  this.playerTextbox = null;

  this.turns = [];
  this.currentTurn = new Turn(this.isCreator, 0);
  
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

  this.commands = commands(this);
}
util.inherits(Game, events.EventEmitter);
module.exports = Game;

/**
 * Starts the game.
 */
Game.prototype.start = function() {
  // the creator starts first
  if (this.isCreator) {
    // TODO this is just temporary to test object/tile placement. Will be replaced once tile selector GUI is done.
    // choose some arbitrary tile and object
    var grass1Type = new TileType('grass1', true);
    var tree1Type = new ObjectType('tree1', false);
    this.tileTypeMap['grass1'] = grass1Type;
    this.objectTypeMap['tree1'] = tree1Type;

    this.nextTurn(this.currentTurn);
  } else {
    // the player just waits
  }

  this.emit('gameStarted');
  // loop to keep updating at each tick of the clock
  easeljs.Ticker.addEventListener('tick', this.gameLoop.bind(this));
};

/**
 * Shows or hides the grid.
 * @param  {Boolean} show Should the gird be shown or hidden.
 */
Game.prototype.showGrid = function(show) {
  if (show) this.stage.addChildAt(this.grid.shape, 2);
  else this.stage.removeChildAt(2);
};


/**
 * Performs a given action in the game by executing a Command object.
 * These commands are recorded as part of the current Turn, and are sent to the other player at the end of the turn.
 * 
 * @param  {Command|String} command The command to execute. Can be either a Command object instantiated from game.commands
 * or a string that matches a command object's name, in which case the constructor properties can be passed as additional
 * arguments.
 *
 * @example
 * // This call:
 * game.executeCommand('MoveHero', newX, newY);
 * // is equivalent to this call:
 * var command = new game.commands.MoveHero(newX, newY);
 * game.executeCommand(command);
 */
Game.prototype.executeCommand = function(command) {
  if (!this.active) throw 'Game method called while not in active turn';
  if (typeof command === 'string') {
    // see:
    //  http://nullprogram.com/blog/2013/03/24/
    //  http://stackoverflow.com/questions/1606797/use-of-apply-with-new-operator-is-this-possible
    var constructor = this.commands[command];
    var args = Array.prototype.slice.call(arguments, 1);
    command = Object.create(constructor.prototype);
    constructor.apply(command, args);
  }
  this.currentTurn.addAndExecute(command);
};


/**
 * Updates the state of the game and all game objects based on a set of changes (expressed as Command objects in a Turn).
 * @param {Turn} lastTurn The new game state changes from the previous turn.
 */
Game.prototype.applyStateChanges = function(lastTurn) {
  for (var i = 0; i < lastTurn.commands.length; i++) {
    var action = lastTurn.commands[i];
    action.execute();
  }
};

/**
 * Begins a new turn.
 * @param {Turn} lastTurn The new game state changes from the previous turn.
 */
Game.prototype.nextTurn = function(lastTurn) {
  // apply each Action from the lastTurn in order (applyStateChanges) and then begin the new turn for that user
  if (!this.active) {
    this.active = true;

    // reset record of changes for this turn
    this.currentTurn.turnNumber = lastTurn.turnNumber + 1;
    this.currentTurn.reset();

    // clear the textboxes/action from the last turn
    (new this.commands.ClearTextboxes()).execute();

    // update the state based on the previous player's turn
    this.applyStateChanges(lastTurn);

    this.numTextboxesByMe = 0;

    console.log('INFO: Turn number ' + this.currentTurn.turnNumber + ' started');
    this.emit('turnStarted', lastTurn);
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
  //console.log('Turn data sent to server:\n', JSON.stringify(this.currentTurn, null, 2));
  this.emit('turnEnded', this.currentTurn);
  return this.currentTurn;
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

  // TODO collision checking goes here?? Won't work for collision resolution

  // render
  this.hero.render();
  this.stage.update();
};

/**
 * TODO Use a preloader instead to manage this.
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
 * TODO Use a preloader instead to manage this.
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
