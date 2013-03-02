/**
 * Represents a tile type. Only one instance should exist for each image.
 * @type {Class}
 */
var TileType = new Class({
	id : null,
	image : null,

	/**
	 * Constructor method.
	 * 
	 * @constructor
	 * @param  {integer} id Unique number 
	 * @param  {Image} image Image to use for this tile (see DOM docs on Image).
	 */
	initialize : function (id, image) {
		this.id = id;
		this.image = image;
	}
});

// constant for the ID representing no image
TileType.EMPTY_ID = -1;