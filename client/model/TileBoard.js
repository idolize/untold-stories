var easeljs = require('easeljs');
var BoardTile = require('./BoardTile');

/**
 * Constructor method.
 *
 * @constructor
 * @param  {integer} numWide Number of tiles wide.
 * @param  {integer} numHigh Number of tiles high.
 * @param  {integer} tileSize The size of a tile in pixels (width or height since tiles are square).
 * @param  {TileType[][]} [tiles] A pre-initialized 2D tile array.
 * @param  {Container} [container] An optional container to initialize with (defaults to a new container).
 */
function TileBoard(numWide, numHigh, tileSize, tiles, container) {
  this.numWide = numWide;
  this.numHigh = numHigh;
  this.tileSize = tileSize;
  this.container = container || new easeljs.Container();
  if (tiles) {
    this.setAllTiles(tiles);
  } else {
    // initialize tiles as empty array with the specified numWide and numHigh
    this.tiles = new Array(numHigh);
    for (var i = 0; i < numHigh; i++) {
      this.tiles[i] = new Array(numWide);
    }
  }
}

/**
 * Gets the tile from the board at the specified location.
 *
 * @param  {integer} x Coordinate on the x-axis.
 * @param  {integer} y Coordinate on the y-axis.
 * @return {BoardTile} The tile at that location.
 */
TileBoard.prototype.getTile = function(x, y) {
  return this.tiles[y][x];
};

/**
 * Deletes all tiles from the board.
 */
TileBoard.prototype.clearBoard = function() {
  this.container.removeAllChildren();
  for (var i = 0; i < this.width; i++) {
    for (var j = 0; j < this.height; j++) {
      this.tiles[j][i] = null;
    }
  }
};

/**
 * Sets the tile at the specified location.
 * This method is useful to reuse existing BoardTile instances.
 *
 * @param  {integer} x Tile position on the x-axis.
 * @param  {integer} y Tile position on the y-axis.
 * @param  {BoardTile} boardTile The tile to set.
 * @return {Boolean} If the tile was added (true) or replaced (false).
 */
TileBoard.prototype.setTileWithExisting = function(x, y, boardTile) {
  if (y >= this.numHigh || x >= this.numWide) return;
  var added = false;
  var oldTile = this.tiles[y][x];
  if (oldTile) {
    // remove the old bitmap from display list
    this.container.removeChild(oldTile.bitmap);
  }
  this.tiles[y][x] = boardTile;
  if (boardTile) {
    // update values inside the tile
    boardTile.board = this;
    boardTile.x = x;
    boardTile.y = y;
    boardTile.bitmap.x = this.tileSize * x;
    boardTile.bitmap.y = this.tileSize * y;
    // add the bitmap to the display list
    this.container.addChild(boardTile.bitmap);
    added = true;
  }
  return added;
};

/**
 * A convenience method to set a tile at a location by only
 * specifying the tile type. The BoardTile is created and then
 * setTileWithExisting is called.
 *
 * @param {integer} x Tile position on the x-axis.
 * @param {integer} y Tile position on the y-axis.
 * @param {TileType} tileType The type of tile to place.
 * @return {Boolean} If the tile was added (true) or replaced (false).
 */
TileBoard.prototype.setTile = function(x, y, tileType) {
  return this.setTileWithExisting(x, y, new BoardTile(tileType, this));
};

/**
 * Resets all tiles on the board based on the given tile types.
 *
 * @param {TileType[][]} tiles A pre-initialized 2D tile array.
 */
TileBoard.prototype.setAllTiles = function(tiles) {
  // make sure the sizes match
  if (tiles.length != this.numHigh || tiles[0].length != this.numWide) {
    // Note: we only check the first row as an optimization
    throw 'Tiles array sizes do not match numWide and numHigh attributes';
  }
  // remove all children from display list
  this.container.removeAllChildren();
  for (var y = 0; y < tiles.length; y++) {
    var row = tiles[y];
    for (var x = 0; x < row.length; x++) {
      var tileType = row[x];
      if (tileType) {
        this.setTile(x, y, tileType);
      } else {
        // set empty entry
        this.setTileWithExisting(x, y, null);
      }
    }
  }
};

/**
 * Sets all of the tiles on the board to a single type.
 * 
 * @param {TileType} tileType The type to set every tile to.
 */
TileBoard.prototype.setAllTilesToOneType = function(tileType) {
  // remove all children from display list
  this.container.removeAllChildren();
  // iteratively change every tile in the array
  for (var y = 0; y < this.tiles.length; y++) {
    var row = this.tiles[y];
    for (var x = 0; x < row.length; x++) {
      this.setTile(x, y, tileType);
    }
  }
};

/**
 * Creates a copy of the tile board.
 * @return {TileBoard} A copy.
 */
TileBoard.prototype.clone = function() {
  var clone = new TileBoard(this.numWide, this.numHigh, this.tileSize, null, this.container.clone(true));
  for (var i = 0; i < this.width; i++) {
    for (var j = 0; j < this.height; j++) {
      var existingTile = this.tiles[j][i];
      if (existingTile) clone.tiles[j][i] = existingTile;
    }
  }
  return clone;
};

/**
 * Restores the state of the board from a clone.
 * @param  {TileBoard} clone The clone to restore from.
 */
TileBoard.prototype.restoreFromClone = function(clone) {
  // make sure the sizes match
  if (clone.numWide != this.numWide || clone.numHigh != this.numHigh) {
    throw 'The numWide and numHigh attributes of the clone do not match';
  }
  if (clone.tileSize != this.tileSize) {
    throw 'The tileSize attribute of the clone does not match';
  }
  this.container.removeAllChildren();
  this.container = clone.container;
  this.tiles = clone.tiles;
};

module.exports = TileBoard;