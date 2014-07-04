var easeljs = require('easeljs');

/**
 * Represents an actual object on a board.
 *
 * @constructor
 * @param  {ObjectType} objType The type of this object.
 * @param  {ObjectBoard} [objectBoard] The board this object is on.
 */
function BoardObject(objType, objectBoard) {
  this.objType = objType;
  this.bitmap = new easeljs.Bitmap(objType.image);
  if (objectBoard) this.objectBoard = objectBoard;
}

module.exports = BoardObject;