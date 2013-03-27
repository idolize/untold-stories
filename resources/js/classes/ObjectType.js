/**
 * Represents an object type. Only one instance should exist for each image.
 * @type {Class}
 */
var ObjectType = new Class({
	id: null,
	image: null,
	isPassable: null,

	/**
	 * Constructor
	 *
	 * @constructor
	 * @param  {integer}  id Unique number
	 * @param  {Image}  image Image to use for this tile
	 * @param  {Boolean} isPassable Flag for if object is passable
	 */
	initialize: function(id, image, isPassable) {
		this.id = id;
		this.image = image;
		this.isPassable = isPassable;
	}
});

// constant for the ID representing no image
ObjectType.EMPTY_ID = -1;