/**
 * Represents the hero. Only one instance should exist
 * @type {Class}
 */
var Hero = new Class({
	bitmap: null,
	speed: null,
	x: null,
	y: null,

	/**
	 * Constructor Method
	 * @param  {Bitmap} image Bitmap takes sprite image and creates a new bitmap
	 * @param  {Integer} speed Sets the speed for the hero
	 * @param  {Integer} x Sets x coordinates
	 * @param  {Integer} y Sets y coordinates
	 */
	initialize: function(image, speed, x, y) {
		this.bitmap = new createjs.Bitmap(image);
		this.speed = speed;
		this.x = this.bitmap.x = x;
		this.y = this.bitmap.y = y;
	},
	/**
	 * Function to set the key when it is pressed down
	 * @param  {String} key String 'up', 'down', 'left', 'right'
	 */
	keyDown: function(key) {
		this.keyDown[key] = true;
	},

	/**
	 * Function to delete the state of the key being "down"
	 * @param  {String} key String 'up', 'down', 'left', 'right'
	 */
	keyUp: function(key) {
		delete this.keyDown[key];
	},

	/**
	 * Function to update the bitmap location
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
	 * Function to re-render the hero's bitmap location
	 */
	render: function() {
		//set position
		this.bitmap.x = this.x;
		this.bitmap.y = this.y;
		// TODO - for debug use
		console.log("hero bitmap x,y updated to (" + this.bitmap.x + "," + this.bitmap.y + ")");
	}
});