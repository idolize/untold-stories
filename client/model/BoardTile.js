var easeljs = require('easeljs');

/**
 * Represents an actual tile on a board.
 *
 * @constructor
 * @param  {TileType} tileType The type of this tile.
 * @param  {Board} [board] The board this tile is on.
 */
function BoardTile(tileType, board) {
  this.tileType = tileType;
  this.bitmap = new easeljs.Bitmap(tileType.image);
  if (board) this.board = board;
}

module.exports = BoardTile;