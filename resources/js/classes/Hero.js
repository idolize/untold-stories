/**
 * Represents the hero. Only one instance should exist
 * @type {Class}
 */
var Hero = new Class({
	id : null,
	image : null,
	speed : null,

	/**
	 * Constructor method.
	 * 
	 * @constructor
	 * @param  {integer} id Unique number 
	 * @param  {Image} image Image to use for this tile (see DOM docs on Image).
	 * @param {integer} speed Sets hero speed
	 */
	initialize : function (id, image, speed) {
		this.id = id;
		this.image = image;
		this.speed = speed;
	}
});

// constant for the ID representing no image
Hero.EMPTY_ID = -1;