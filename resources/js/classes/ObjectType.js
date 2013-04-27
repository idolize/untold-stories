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
	 * @param  {String}  id Unique name of this type.
	 * @param  {Boolean} isPassable Flag for if object is passable.
	 * @param  {Image|String}  [image] Image or URL of image to use for this object. If not included it is assumed to be stored in 'images/objects/id.png'.
	 */
	initialize: function(id, isPassable, image) {
		this.id = id;
		if (!image) {
			image = 'images/objects/'+id+'.png';
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

// constant for the ID representing no image
ObjectType.EMPTY_ID = -1;