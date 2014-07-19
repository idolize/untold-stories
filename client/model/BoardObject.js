var easeljs = require('easeljs');
var ObjectType = require('./ObjectType');

/**
 * Represents an actual object on a board.
 *
 * @constructor
 * @param  {ObjectType} objType The type of this object.
 * @param  {Integer} [x] The x coordinate on the object board.
 * @param  {Integer} [y] The y coordinate on the object board.
 * @param  {ObjectBoard} [objectBoard] The board this object is on.
 */
function BoardObject(objType, x, y, objectBoard) {
  this.objType = objType;
  this.bitmap = new easeljs.Bitmap(objType.image);
  this.x = x;
  this.y = y;
  if (objectBoard) this.objectBoard = objectBoard;
}

BoardObject.prototype.toJSON = function() {
  return { objType: this.objType, x: this.x, y: this.y };
};

BoardObject.fromJSON = function(jsonObj, game) {
  var objType = ObjectType.fromJSON(jsonObj.objType, game);
  return new BoardObject(objType, jsonObj.x, jsonObj.y, game.objectBoard);
};

module.exports = BoardObject;