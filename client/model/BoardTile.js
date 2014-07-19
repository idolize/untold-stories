var easeljs = require('easeljs');
var TileType = require('./TileType');

/**
 * Represents an actual tile on a board.
 *
 * @constructor
 * @param  {TileType} tileType The type of this tile.
 * @param  {Integer} [x] The x coordinate on the board.
 * @param  {Integer} [y] The y coordinate on the board.
 * @param  {Board} [board] The board this tile is on.
 */
function BoardTile(tileType, x, y, board) {
  this.tileType = tileType;
  this.bitmap = new easeljs.Bitmap(tileType.image);
  this.x = x;
  this.y = y;
  if (board) this.board = board;
}

BoardTile.prototype.toJSON = function() {
  return { tileType: this.tileType, x: this.x, y: this.y };
};

BoardTile.fromJSON = function(jsonObj, game) {
  var tileType = TileType.fromJSON(jsonObj.tileType, game);
  return new BoardTile(tileType, jsonObj.x, jsonObj.y, game.tileBoard);
};

module.exports = BoardTile;