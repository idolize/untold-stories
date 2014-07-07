var easeljs = require('easeljs');

/**
 * Represents the hero. Only one instance should exist.
 * @consttructor
 * @param  {Image|String} image Image or URL string of image to use for the hero.
 * @param  {Integer} width Width of the image.
 * @param  {Integer} height Height of the image.
 * @param  {Integer} x The x location of the hero on the stage.
 * @param  {Integer} y The y location of the hero on the stage.
 */
function Hero(image, width, height, x, y) {
  this.bitmap = new easeljs.Bitmap(image);
  this.x = this.bitmap.x = x;
  this.y = this.bitmap.y = y;
  this.width = width;
  this.height = height;
}
module.exports = Hero;

/**
 * Updates the hero's bitmap location.
 */
Hero.prototype.render = function() {
  //set position
  this.bitmap.x = this.x;
  this.bitmap.y = this.y;
};