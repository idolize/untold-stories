var easeljs = require('easeljs');
var BoardObject = require('./BoardObject');

/**
 * Constructor method.
 *
 * @constructor
 * @param  {integer} numWide Number of objects wide.
 * @param  {integer} numHigh Number of objects high.
 * @param  {integer} tileSize Since objects snap to the grid, the tile size for the grid is required (in pixels).
 * @param {ObjectType[][]} [objects] A pre-initialized 2D object array.
 * @param  {Container} [container] An optional container to initialize with (defaults to a new container).
 */
function ObjectBoard(numWide, numHigh, tileSize, objects, container) {
  this.numWide = numWide;
  this.numHigh = numHigh;
  this.tileSize = tileSize;
  this.container = container || new easeljs.Container();
  if (objects) {
    this.setAllObjects(objects);
  } else {
    // initialize objects as empty array with the specified numWide and numHigh
    this.objects = new Array(numHigh);
    for (var i = 0; i < numHigh; i++) {
      this.objects[i] = new Array(numWide);
    }
  }
}

/**
 * Gets the object from the board at the specified location.
 *
 * @param  {integer} x Coordinate on the x-axis.
 * @param  {integer} y Coordinate on the y-axis.
 * @return {BoardObject} The object at that location.
 */
ObjectBoard.prototype.getObject = function(x, y) {
  return this.objects[y][x];
};

/**
 * Gets the object that is on top of the display list at canvas position (x,y).
 *
 * @param {integer} x Canvas position on the x-axis.
 * @param {integer} y Canvas position on the y-axis.
 *
 * @return {Object} An object with x and y for the board coordinates of the object.
 *                  If no object was under the mouse, returns null.
 */
ObjectBoard.prototype.getObjectAtGlobalPosition = function(x, y) {
  var entry = this.container.getObjectUnderPoint(x, y);
  if (entry) {
    var coords = this.getBoardCoordinatesFromGlobalPosition(entry.x, entry.y);
    var object = this.getObject(coords.x, coords.y);
    if (!object) throw 'Error: unable to find expected object in objectBoard at coordinates: '+coords.x+','+coords.y;
    return object;
  } else {
    return null;
  }
};

/**
 * Converts global coordinates into board coordinates.
 * @param {integer} x canvas position on the x-axis
 * @param {integer} y canvas position on the y-axis
 * @return {Object} an object with x and y for the board coordinates of the object.
 *                  If no object was under the mouse, returns null
 */
ObjectBoard.prototype.getBoardCoordinatesFromGlobalPosition = function(x, y) {
  var boardX = Math.floor(x/this.tileSize);
  var boardY = Math.floor(y/this.tileSize);
  return { x: boardX, y: boardY };
};

/**
 * Deletes an object from the board.
 * 
 * @param  {integer} x            object position on the x-axis.
 * @param  {integer} y            object position on the y-axis.
 * @param  {Boolean} [keepBitmap] If the bitmap object should remain on the container. Default false.
 */
ObjectBoard.prototype.deleteObject = function(x, y, keepBitmap) {
  if (keepBitmap) this.objects[y][x] = null;
  else this.setObjectWithExisting(x, y, null);
};

/**
 * Deletes all objects from the board.
 */
ObjectBoard.prototype.clearBoard = function() {
  this.container.removeAllChildren();
  for (var i = 0; i < this.width; i++) {
    for (var j = 0; j < this.height; j++) {
      this.objects[j][i] = null;
    }
  }
};

/**
 * Sets the object at the specified location.
 * This method is useful to reuse existing BoardObject instances.
 *
 * @param  {integer} x object position on the x-axis.
 * @param  {integer} y object position on the y-axis.
 * @param  {BoardObject} boardObject The object to set.
 * @param  {Boolean} [alreadyAdded] If the object has already been added to the display list. Default false.
 */
ObjectBoard.prototype.setObjectWithExisting = function(x, y, boardObject, alreadyAdded) {
  if (y >= this.numHigh || x >= this.numWide) return;
  var oldObject = this.objects[y][x];
  if (oldObject && (!alreadyAdded || oldObject !== boardObject)) {
    // remove the old bitmap from display list
    this.container.removeChild(oldObject.bitmap);
  }
  this.objects[y][x] = boardObject;
  if (boardObject) {
    // update values inside the object
    boardObject.board = this;
    boardObject.x = x;
    boardObject.y = y;
    boardObject.bitmap.x = this.tileSize * x;
    boardObject.bitmap.y = this.tileSize * y;
    // add the bitmap to the display list
    if (!alreadyAdded) this.container.addChild(boardObject.bitmap);
  }
};

/**
 * A convenience method to set a object at a location by only
 * specifying the object type. The BoardTile is created and then
 * setTileWithExisting is called.
 *
 * @param {integer} x Object position on the x-axis.
 * @param {integer} y Object position on the y-axis.
 * @param {ObjectType} objType The type of object to place.
 */
ObjectBoard.prototype.setObject = function(x, y, objType) {
  this.setObjectWithExisting(x, y, new BoardObject(objType, this));
};

/**
 * Resets all objects on the board based on the given object types.
 *
 * @param {ObjectType[][]} objects A pre-initialized 2D object array.
 */
ObjectBoard.prototype.setAllObjects = function(objects) {
  // make sure the sizes match
  if (objects.length != this.numHigh || objects[0].length != this.numWide) {
    // Note: we only check the first row as an optimization
    throw "Objects array sizes do not match numWide and numHigh attributes";
  }
  // remove all children from display list
  this.container.removeAllChildren();
  for (var y = 0; y < objects.length; y++) {
    var row = objects[y];
    for (var x = 0; x < row.length; x++) {
      var objType = row[x];
      if (objType) {
        this.setObject(x, y, objType);
      } else {
        // set empty entry
        this.setObjectWithExisting(x, y, null);
      }
    }
  }
};

/**
 * Creates a copy of the tile board.
 * @return {TileBoard} A copy.
 */
ObjectBoard.prototype.clone = function() {
  var clone = new ObjectBoard(this.numWide, this.numHigh, this.tileSize, null, this.container.clone(true));
  for (var i = 0; i < this.width; i++) {
    for (var j = 0; j < this.height; j++) {
      var existingObj = this.objects[j][i];
      if (existingObj) clone.objects[j][i] = existingObj;
    }
  }
  return clone;
};

/**
 * Restores the state of the board from a clone.
 * @param  {TileBoard} clone The clone to restore from.
 */
ObjectBoard.prototype.restoreFromClone = function(clone) {
  // make sure the sizes match
  if (clone.numWide != this.numWide || clone.numHigh != this.numHigh) {
    throw 'The numWide and numHigh attributes of the clone do not match';
  }
  if (clone.tileSize != this.tileSize) {
    throw 'The tileSize attribute of the clone does not match';
  }
  this.container.removeAllChildren();
  this.container = clone.container;
  this.objects = clone.objects;
};

module.exports = ObjectBoard;