/**
 * Represents a tile type. Only one instance should exist for each image.
 * @type {Class}
 */
var TileType = new Class({
	id: null,
	image: null,
	isPassable: null,

	/**
	 * Constructor method.
	 *
	 * @constructor
	 * @param  {integer} id Unique number
	 * @param  {Image} image Image to use for this tile (see DOM docs on Image).
	 * @param {Boolean} isPassable Flag to check if tile is passable
	 */
	initialize: function(id, image, isPassable) {
		this.id = id;
		this.image = image;
		this.isPassable = isPassable;
	}
});

// constant for the ID representing no image
TileType.EMPTY_ID = -1;