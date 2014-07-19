var uuid = require('uuid');
var TileType = require('./TileType');
var ObjectType = require('./ObjectType');
var BoardObject = require('./BoardObject');
var TextBox = require('./TextBox');

// Factory pattern: each class is created as a closure scoped to the game instance passed to require()
module.exports = exports = createNamespace;

function createNamespace(game) {
  var commands = {}; // namespace for all our Command subclasses

  /**
   * Adds a new object to the game board or moves an existing object to a new location. Replaces an existing object if
   * placed at the same location as an existing object.
   * 
   * @constructor
   * @param  {ObjectType|BoardObject} object The object to move or the type of new object to place.
   * @param  {integer} x                     The x board coordinate of where to place the object.
   * @param  {integer} y                     The y board coordinate of where to place the object.
   */
  function PlaceObject(object, x, y) {
    this.x = x;
    this.y = y;

    if (object instanceof ObjectType) {
      this.objectType = object;
    } else {
      this.object = object;
      this.objectType = object.objType;
    }
  }
  PlaceObject.prototype.execute = function() {
    var objAtLocation = game.objectBoard.getObject(this.x, this.y);
    if (objAtLocation) {
      this.prevObjType = objAtLocation.objType;
    }
    if (this.object) {
      game.objectBoard.setObjectWithExisting(this.x, this.y, this.object, true);
    } else {
      game.objectBoard.setObject(this.x, this.y, this.objectType);
    }
  };
  PlaceObject.prototype.unExecute = function() {
    if (this.prevObjType) {
      game.objectBoard.setObject(this.x, this.y, this.prevObjType);
    } else {
      game.objectBoard.deleteObject(this.x, this.y);
    }
  };
  PlaceObject.prototype.toJSON = function() {
    return { type: 'PlaceObject', x: this.x, y: this.y, objectType: this.objectType };
  };
  PlaceObject.fromJSON = function(jsonObj) {
    // TODO switch to new dynamic Image preload/creation methodology
    var objType = ObjectType.fromJSON(jsonObj.objectType, game);
    return new PlaceObject(objType, jsonObj.x, jsonObj.y);
  };
  commands.PlaceObject = PlaceObject;


  /**
   * Used to reposition an object from one location to another.
   * Currently this is done via a deletion at the old location and insertion at new location.
   * 
   * @constructor
   * @param  {integer}     oldX             The old board position of the object.
   * @param  {integer}     oldY             The old board position of the object.
   * @param  {integer}     newX             The new board position of the object.
   * @param  {integer}     newY             The new board position of the object.
   */
  function MoveObject(oldX, oldY, newX, newY) {
    this.oldPos = { x: oldX, y: oldY };
    this.newPos = { x: newX, y: newY };
  }
  MoveObject.prototype.execute = function() {
    this.boardObjectToMove = game.objectBoard.getObject(this.oldPos.x, this.oldPos.y);
    var objAtNewLocation = game.objectBoard.getObject(this.newPos.x, this.newPos.y);
    if (objAtNewLocation) {
      this.replacedObjType = objAtNewLocation.objType;
    }

    game.objectBoard.setObjectWithExisting(this.newPos.x, this.newPos.y, this.boardObjectToMove, true);
    if (this.oldPos.x != this.newPos.x || this.oldPos.y != this.newPos.y) {
      // cleanup old location on board
      game.objectBoard.deleteObject(this.oldPos.x, this.oldPos.y, true);
    }
  };
  MoveObject.prototype.unExecute = function() {
    game.objectBoard.setObjectWithExisting(this.oldPos.x, this.oldPos.y, this.boardObjectToMove, true);
    if (this.replacedObjType && (this.oldPos.x != this.newPos.x || this.oldPos.y != this.newPos.y)) {
      // put back prev obj at 'new' location on board
      game.objectBoard.setObject(this.newPos.x, this.newPos.y, this.replacedObjType);
    }
  };
  MoveObject.prototype.toJSON = function() {
    return { type: 'MoveObject', oldPos: this.oldPos, newPos: this.newPos };
  }
  MoveObject.fromJSON = function(jsonObj) {
    return new MoveObject(jsonObj.oldPos.x, jsonObj.oldPos.y, jsonObj.newPos.x, jsonObj.newPos.y);
  }
  commands.MoveObject = MoveObject;


  /**
   * Adds an tile to the game board or replaces an existing tile if placed at the same location as
   * an existing tile.
   * 
   * @constructor
   * @param  {TileType} tileType        The type of tile to place.
   * @param  {integer} x                The x board coordinate of where to place the tile.
   * @param  {integer} y                The y board coordinate of where to place the tile.
   */
  function PlaceTile(tileType, x, y) {
    this.tileType = tileType;
    this.x = x;
    this.y = y;
  }
  PlaceTile.prototype.execute = function() {
    var tileAtLocation = game.tileBoard.getTile(this.x, this.y);
    if (tileAtLocation) {
      this.prevTileType = tileAtLocation.tileType;
    }
    game.tileBoard.setTile(this.x, this.y, this.tileType);
  };
  PlaceTile.prototype.unExecute = function() {
    if (this.prevTileType) {
      game.tileBoard.setTile(this.x, this.y, this.prevTileType);
    } else {
      game.tileBoard.setTile(this.x, this.y, null);
    }
  };
  PlaceTile.prototype.toJSON = function() {
    return { type: 'PlaceTile', x: this.x, y: this.y, tileType: this.tileType };
  };
  PlaceTile.fromJSON = function(jsonObj) {
    // TODO switch to new dynamic Image preload/creation methodology
    var tileType = TileType.fromJSON(jsonObj.tileType, game);
    return new PlaceTile(tileType, jsonObj.x, jsonObj.y);
  };
  commands.PlaceTile = PlaceTile;


  /**
   * Moves the hero to a new (global) location.
   * 
   * @constructor
   * @param  {integer} x          The new cavas x coordinate of the hero.
   * @param  {integer} y          The new canvas y coordinate of the hero.
   */
  function MoveHero(x, y) {
    this.newPos = { x: x, y: y };
    this.onlyUseLast = true;
  }
  MoveHero.prototype.execute = function() {
    this.oldPos = { x: game.hero.x, y: game.hero.y };
    game.hero.x = this.newPos.x;
    game.hero.y = this.newPos.y;
  };
  MoveHero.prototype.unExecute = function() {
    game.hero.x = this.oldPos.x;
    game.hero.y = this.oldPos.y;
  };
  MoveHero.prototype.toJSON = function() {
    return { type: 'MoveHero', newPos: this.newPos };
  };
  MoveHero.fromJSON = function(jsonObj) {
    return new MoveHero(jsonObj.newPos.x, jsonObj.newPos.y);
  };
  commands.MoveHero = MoveHero;


  /**
   * Deleted an object at the given board location.
   *
   * @constructor
   * @param  {integer} x         The board-local x coordinate of the object to delte.
   * @param  {integer} y         The board-local y coordinate of the object to delete.
   */
  function DeleteObject(x, y) {
    this.x = x;
    this.y = y;
  }
  DeleteObject.prototype.execute = function() {
    this.deletedObject = game.objectBoard.getObject(this.x, this.y);
    game.objectBoard.deleteObject(this.x, this.y);
  };
  DeleteObject.prototype.unExecute = function() {
    if (this.deletedObject) {
      game.objectBoard.setObjectWithExisting(this.x, this.y, this.deletedObject);
    }
  };
  DeleteObject.prototype.toJSON = function() {
    return { type: 'DeleteObject', x: this.x, y: this.y };
  };
  DeleteObject.fromJSON = function(jsonObj) {
    return new DeleteObject(jsonObj.x, jsonObj.y);
  };
  commands.DeleteObject = DeleteObject;


  /**
   * Adds a textbox to the game. If the Player is calling this method after they have already placed their textbox
   * then it is moved rather than adding a new textbox.
   *
   * @constructor
   * @param  {String}   text          The text content of the text box.
   * @param  {Integer}  x             The global (canvas) x coordinate of the text box.
   * @param  {Integer}  y             The global (canvas) y coordinate of the text box.
   * @param  {Boolean}  isCreators    If this textbox belongs to the creator or not.
   * @param  {String}   [textboxId]   An optional ID to use for the textbox.
   */
  function AddTextbox(text, x, y, isCreators, textboxId) {
    this.text = text;
    this.x = x;
    this.y = y;
    this.isCreators = isCreators;
    this.textboxId = textboxId || uuid.v4();
  }
  AddTextbox.prototype.execute = function() {
    this.textbox = new TextBox(this.text, this.x, this.y, false, this.textboxId);
    if (this.isCreators) {
      game.creatorTextboxes[this.textbox.id] = this.textbox;
    } else {
      game.playerTextbox = this.textbox;
    }
  };
  AddTextbox.prototype.unExecute = function() {
    this.textbox.destroy();
    if (this.isCreators) {
      delete game.creatorTextboxes[this.textbox.id];
    } else {
      game.playerTextbox = null;
    }
  };
  AddTextbox.prototype.toJSON = function() {
    return { type: 'AddTextbox', text: this.text, x: this.x, y: this.y, isCreators: this.isCreators, textboxId: this.textboxId };
  };
  AddTextbox.fromJSON = function(jsonObj) {
    return new AddTextbox(jsonObj.text, jsonObj.x, jsonObj.y, jsonObj.isCreators, jsonObj.textboxId);
  };
  commands.AddTextbox = AddTextbox;


  /**
   * Only called during the same turn to remove a textbox the player/creator decides they don't want anymore.
   * Not needed between turns because textboxes automatically clear.
   * 
   * @constructor
   * @param  {String}  textboxId   The ID of the textbox to remove.
   * @param  {Boolean} isCreators  If this textbox belongs to the creator or not.
   */
  function RemoveTextbox(textboxId, isCreators) {
    this.textboxId = textboxId;
    this.isCreators = isCreators;
  }
  RemoveTextbox.prototype.execute = function() {
    var textbox;
    if (this.isCreators) {
      textbox = game.creatorTextboxes[this.textboxId];
      delete game.creatorTextboxes[this.textboxId];
    } else {
      textbox = game.playerTextbox;
      game.playerTextbox = null;
    }
    this.removedTextboxPos = textbox.pos;
    textbox.destroy();
  };
  RemoveTextbox.prototype.unExecute = function() {
    var textbox = new TextBox(this.text, this.x, this.y, false, this.textboxId);
    if (this.isCreators) {
      game.creatorTextboxes[this.textbox.id] = this.textbox;
    } else {
      game.playerTextbox = textbox;
    }
  };
  RemoveTextbox.prototype.toJSON = function() {
    return { type: 'RemoveTextbox', textboxId: this.textboxId, isCreators: this.isCreators };
  };
  RemoveTextbox.fromJSON = function(jsonObj) {
    return new RemoveTextbox(jsonObj.textboxId, jsonObj.isCreators);
  };
  commands.RemoveTextbox = RemoveTextbox;


  /**
   * Used to move textboxes around on the screen.
   *
   * @constructor
   * @param {String}  textboxId The textbox ID to move.
   * @param {Integer} newX      The new (global) X coordinate of the textbox.
   * @param {Integer} newY      The new (global) Y coordinate of the textbox.
   */
  function MoveTextbox(textboxId, newX, newY) {
    this.textboxId = textboxId;
    this.newX = newX;
    this.newY = newY;
  }
  MoveTextbox.prototype.execute = function() {
    this.textbox;
    if (game.playerTextbox && game.playerTextbox.id === this.textboxId) this.textbox = game.playerTextbox;
    else {
      this.textbox = game.creatorTextboxes[this.textboxId];
      if (!this.textbox) throw 'Invalid textbox ID to move';
    }
    this.oldPos = { x: this.textbox.pos.x, y: this.textbox.pos.y };
    this.textbox.setPos(this.newX, this.newY);
  };
  MoveTextbox.prototype.unExecute = function() {
    this.textbox.setPos(this.oldPos.x, this.oldPos.y);
  };
  MoveTextbox.prototype.toJSON = function() {
    return { type: 'MoveTextbox', textboxId: this.textboxId, newX: this.newX, newY: this.newY };
  };
  MoveTextbox.fromJSON = function(jsonObj) {
    return new MoveTextbox(jsonObj.textboxId, jsonObj.newX, jsonObj.newY);
  };
  commands.MoveTextbox = MoveTextbox;


  /**
   * Places an action at the given location if an action does not currently exist.
   * If an action already exists then it is moved to the new location.
   * 
   * @constructor
   * @param  {String}  text       The action content of the action box.
   * @param  {Integer}  x          The global (canvas) x coordinate of the action box.
   * @param  {Integer}  y          The global (canvas) y coordinate of the action box.
   */
  function PlaceAction(text, x, y) {
    this.text = text;
    this.x = x;
    this.y = y;
  }
  PlaceAction.prototype.execute = function() {
    game.actionBox = new TextBox(this.text, this.x, this.y, true);
  };
  PlaceAction.prototype.unExecute = function() {
    game.actionBox.destroy();
    game.actionBox = null;
  };
  PlaceAction.prototype.toJSON = function() {
    return { type: 'PlaceAction', text: this.text, x: this.x, y: this.y };
  };
  PlaceAction.fromJSON = function(jsonObj) {
    return new PlaceAction(jsonObj.text, jsonObj.x, jsonObj.y);
  };
  commands.PlaceAction = PlaceAction;


  /**
   * Used to move the action box around on the screen.
   *
   * @constructor
   * @param {Integer} newX      The new (global) X coordinate of the action box.
   * @param {Integer} newY      The new (global) Y coordinate of the action box.
   */
  function MoveAction(newX, newY) {
    this.newX = newX;
    this.newY = newY;
  }
  MoveAction.prototype.execute = function() {
    if (!game.actionBox) throw 'No action box to move';
    this.oldPos = { x: game.actionBox.pos.x, y: game.actionBox.pos.y };
    game.actionBox.setPos(this.newX, this.newY);
  };
  MoveAction.prototype.unExecute = function() {
    game.actionBox.setPos(this.oldPos.x, this.oldPos.y);
  };
  MoveAction.prototype.toJSON = function() {
    return { type: 'MoveAction', newX: this.newX, newY: this.newY };
  };
  MoveAction.fromJSON = function(jsonObj) {
    return new MoveAction(jsonObj.newX, jsonObj.newY);
  };
  commands.MoveAction = MoveAction;


  /**
   * Removes the player action if it exists. This method is only needed/used by the Player
   * to delete an action placed in the same turn.
   *
   * @constructor
   */
  function RemoveAction() {
    this.onlyUseLast = true;
  }
  RemoveAction.prototype.execute = function() {
    this.removedAction = game.actionBox.toJSON();
    game.actionBox.destroy();
    game.actionBox = null;
  };
  RemoveAction.prototype.unExecute = function() {
    game.actionBox = TextBox.fromJSON(this.removedAction);
  };
  RemoveAction.prototype.toJSON = function() {
    return { type: 'RemoveAction' };
  };
  RemoveAction.fromJSON = function(jsonObj) {
    return new RemoveAction();
  };
  commands.RemoveAction = RemoveAction;


  /**
   * Clears any existing textboxes and action created by player and creator.
   * These changes are only local and do not get saved in the state changes or sent to the other client on turn
   * end.
   *
   * @constructor
   */
  function ClearTextboxes() {
    this.onlyUseLast = true;
  }
  ClearTextboxes.prototype.execute = function() {
    this.backup = { creatorTextboxes: {} };
    Object.each(game.creatorTextboxes, function(textbox, key) {
      this.backup.creatorTextboxes[key] = textbox.toJSON();
      textbox.destroy();
    }, this);
    game.creatorTextboxes = {};
    if (game.playerTextbox) {
      this.backup.playerTextbox = game.playerTextbox.toJSON();
      game.playerTextbox.destroy();
      game.playerTextbox = null;
    }
    if (game.actionBox) {
      this.backup.actionBox = game.actionBox.toJSON();
      game.actionBox.destroy();
      game.actionBox = null;
    }
  };
  ClearTextboxes.prototype.unExecute = function() {
    Object.each(this.backup.creatorTextboxes, function(textboxJson, key) {
      var textbox = TextBox.fromJSON(this.backup.creatorTextboxes[key]);
      delete this.backup.creatorTextboxes[key];
      game.creatorTextboxes[this.textbox.id] = textbox;
    }, this);
    if (this.backup.playerTextbox) {
      var textbox = TextBox.fromJSON(this.backup.playerTextbox);
      this.backup.playerTextbox = null;
      game.playerTextbox = textbox;
    }
    if (this.backup.actionBox) {
      var textbox = TextBox.fromJSON(this.backup.actionBox);
      this.backup.actionBox = null;
      game.actionBox = textbox;
    }
  };
  ClearTextboxes.prototype.toJSON = function() {
    return { type: 'ClearTextboxes' };
  };
  ClearTextboxes.fromJSON = function(jsonObj) {
    return new ClearTextboxes();
  };
  commands.ClearTextboxes = ClearTextboxes;


  /**
   * Clears all objects and tiles from the screen.
   * 
   * @constructor
   */
  function ClearScreen() {
    this.onlyUseLast = true;
  }
  ClearScreen.prototype.execute = function() {
    this.tileBoardBackup = game.tileBoard.clone();
    game.tileBoard.clearBoard();
    this.objectBoardBackup = game.objectBoard.clone();
    game.objectBoard.clearBoard();
  };
  ClearScreen.prototype.unExecute = function() {
    // TODO This may need some more testing to be sure it doesn't mess things up
    game.tileBoard.restoreFromClone(this.tileBoardBackup);
    game.objectBoard.restoreFromClone(this.objectBoardBackup);
  };
  ClearScreen.prototype.toJSON = function() {
    return { type: 'ClearScreen' };
  };
  ClearScreen.fromJSON = function(jsonObj) {
    return new ClearScreen();
  };
  commands.ClearScreen = ClearScreen;


  return commands;
}