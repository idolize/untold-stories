/**
 * Represents an actual object on a board.
 * @type {Class}
 */
var BoardObject = new Class({
	objType: null,
	bitmap: null,
	objectBoard: null,
	objPosX: null,
	objPosY: null,

	/**
	 * Constructor method.
	 *
	 * @constructor
	 * @param  {ObjectType} objType The type of this tile.
	 * @param  {ObjectBoard} [objectBoard] The board this tile is on.
	 */
	initialize: function(objType, objectBoard) {
		this.objType = objType;
		this.bitmap = new createjs.Bitmap(objType.image);
		if (objectBoard) this.objectBoard = objectBoard;
	}
});