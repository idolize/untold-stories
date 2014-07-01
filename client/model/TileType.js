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
	 * @param  {String} id Unique name of this type.
	 * @param {Boolean} isPassable Flag to check if tile is passable.
	 * @param  {Image|String}  [image] Image or URL of image to use for this tile. If not included it is assumed to be stored in 'images/tiles/id.png'.
	 */
	initialize: function(id, isPassable, image) {
		this.id = id;
		if (!image) {
			image = 'images/tiles/'+id+'.png';
		}
		if (typeof image == 'string' || image instanceof String) {
			// download the image
			this.image = new Image();
			this.image.src = image;
		} else {
			this.image = image;
		}
		this.isPassable = isPassable;
	}
});