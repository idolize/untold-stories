/**
 * Represents the hero. Only one instance should exist
 * @type {Class}
 */
var Hero = new Class({
	bitmap : null,
	speed : null,
	x : null,
	y : null,
	keyDown : {},

	/**
	 * Constructor Method
	 * @param  {Bitmap} image Bitmap takes sprite image and creates a new bitmap
	 * @param  {Integer} speed Sets the speed for the hero
	 * @param  {Integer} x Sets x coordinates (actually a float, but we are taking the floor)
	 * @param  {Integer} y Sets y coordinates (actually a float, but we are taking the floor)]
	 */
	initialize : function (image, speed, x, y) {
		this.bitmap = new createjs.Bitmap(image);
		this.speed = speed;
		this.x = this.bitmap.x = x;
		this.y = this.bitmap.y = y;
	},

	
	/**
	 * Function to update the bitmap location
	 * @param  {Integer} delta Create.js takes the time difference between 'then' and 'now'
	 */
	updateMove: function(delta) {
        var modifier = delta/1000;
        var oldX = this.x;
        var oldY = this.y;
       
		if (38 in this.keyDown) { // Player holding up
			this.y -= Math.floor(this.speed * modifier);
		}
		if (40 in this.keyDown) { // Player holding down
			this.y += Math.floor(this.speed * modifier);
		}
		if (37 in this.keyDown) { // Player holding left
			this.x -= Math.floor(this.speed * modifier);
		}
		if (39 in this.keyDown) { // Player holding right
			this.x += Math.floor(this.speed * modifier);
		}
	},


	/**
	 * Function to re-render the hero's bitmap location
	 */
	render: function(){
		//set position
		this.bitmap.x = this.x;
		this.bitmap.y = this.y;
		// TODO - for debug use
		console.log("hero bitmap x,y updated to ("+this.bitmap.x+","+this.bitmap.y+")");
	}
});
