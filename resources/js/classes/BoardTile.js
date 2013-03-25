/**
 * Represents an actual tile on a board.
 * @type {Class}
 */
var BoardTile = new Class({
	tileType: null,
	bitmap: null,
	board: null,
	tilePosX: null,
	tilePosY: null,

	/**
	 * Constructor method.
	 *
	 * @constructor
	 * @param  {TileType} tileType The type of this tile.
	 * @param  {Board} [board] The board this tile is on.
	 */
	initialize: function(tileType, board) {
		this.tileType = tileType;
		this.bitmap = new createjs.Bitmap(tileType.image);
		if (board) this.board = board;
	}
});