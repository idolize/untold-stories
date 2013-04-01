/**
 * Represents the hero. Only one instance should exist.
 * @type {Class}
 */
var Hero = new Class({
	bitmap: null,
	speed: null,
	x: null,
	y: null,
	width: null,
	height: null,

	/**
	 * Constructor Method.
	 *
	 * @consttructor
	 * @param  {Image|String} image Image or URL string of image to use for the hero.
	 * @param  {Integer} width Width of the image.
	 * @param  {Integer} height Height of the image.
	 * @param  {Integer} speed The speed for the hero.
	 * @param  {Integer} x The x location of the hero on the stage.
	 * @param  {Integer} y The y location of the hero on the stage.
	 */
	initialize: function(image, width, height, speed, x, y) {
		this.bitmap = new createjs.Bitmap(image);
		this.speed = speed;
		this.x = this.bitmap.x = x;
		this.y = this.bitmap.y = y;
	},
	/**
	 * Sets the key when it is pressed down. Can be called asynchronously outside of normal
	 * game loop/update method.
	 * @param  {String} key String 'up', 'down', 'left', 'right'.
	 */
	keyDown: function(key) {
		this.keyDown[key] = true;
	},

	/**
	 * Deletes the state of the key being "down". Can be called asynchronously outside of normal
	 * game loop/update method.
	 * @param  {String} key String 'up', 'down', 'left', 'right'.
	 */
	keyUp: function(key) {
		delete this.keyDown[key];
	},

	/**
	 * Updates the location of the hero.
	 * @param  {Integer} delta Create.js takes the time difference between 'then' and 'now'
	 */
	updateMove: function(delta) {
		var modifier = delta / 1000;
		var oldX = this.x;
		var oldY = this.y;

		if ('up' in this.keyDown) { // Player holding up
			this.y -= Math.floor(this.speed * modifier);
		}
		if ('down' in this.keyDown) { // Player holding down
			this.y += Math.floor(this.speed * modifier);
		}
		if ('left' in this.keyDown) { // Player holding left
			this.x -= Math.floor(this.speed * modifier);
		}
		if ('right' in this.keyDown) { // Player holding right
			this.x += Math.floor(this.speed * modifier);
		}
	},

	/**
	 * Updates the hero's bitmap location.
	 */
	render: function() {
		//set position
		this.bitmap.x = this.x;
		this.bitmap.y = this.y;
	}
});