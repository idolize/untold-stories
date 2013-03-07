
var ObjectType = new Class({
	id : null,
	image : null,
	isPassable : null,

	/**
	 * [initialize description]
	 * @param  {[type]}  id         [description]
	 * @param  {[type]}  image      [description]
	 * @param  {Boolean} isPassable [description]
	 * @return {[type]}             [description]
	 */
	initialize : function (id, image, isPassable) {
		this.id = id;
		this.image = image;
		this.isPassable = isPassable;
	}
});

// constant for the ID representing no image
TileType.EMPTY_ID = -1;