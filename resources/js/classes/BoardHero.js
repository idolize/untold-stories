/**
 * Represents the actual hero on a board.
 * @type {Class}
 */
var BoardHero = new Class({
	hero : null,
	bitmap : null,
	heroBoard : null,
	heroPosX : null,
	heroPosY : null,

	/**
	 * Constructor method.
	 *
	 * @constructor
	 * @param  {TileType} tileType The type of this tile.
	 * @param  {HeroBoard} [heroBoard] The board this tile is on.
	 */
	initialize : function (hero, heroBoard) {
		this.hero = hero;
		this.bitmap = new createjs.Bitmap(hero.image);
		if (heroBoard) this.heroBoard = heroBoard;
	}
});