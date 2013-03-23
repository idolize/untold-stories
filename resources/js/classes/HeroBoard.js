var HeroBoard = new Class({
	hero : null,
	numWide : null,
	numHigh : null,
	heroSize : null,
	container : null,

	/**
	 * Constructor method.
	 * 
	 * @constructor
	 * @param  {integer} numWide Number of tiles wide.
	 * @param  {integer} numHigh Number of tiles high.
	 * @param {Hero} [hero] A pre-initialized 2D tile array.
	 */
	initialize : function (numWide, numHigh, heroSize, hero) {
		this.numWide = numWide;
		this.numHigh = numHigh;
		this.heroSize = heroSize;
		this.container = new createjs.Container();
		this.setHero(hero);
	},

	/**
	 * Gets the tile from the board at the specified location.
	 * 
	 * @param  {integer} x Coordinate on the x-axis.
	 * @param  {integer} y Coordinate on the y-axis.
	 * @return {BoardHero} The tile at that location.
	 */
	getHero : function (x, y) {
		return hero;
	},

	/**
	 * Sets the tile at the specified location.
	 * This method is useful to reuse existing BoardHero instances.
	 * 
	 * @param  {integer} x Tile position on the x-axis.
	 * @param  {integer} y Tile position on the y-axis.
	 * @param  {BoardHero} BoardHero The tile to set.
	 */
	setHeroWithExisting : function (x, y, boardHero) {
		var oldHero = this.hero;
		if (oldHero) {
			// remove the old bitmap from display list
			this.container.removeChild(oldHero.bitmap);
		}
		this.hero = boardHero;
		if (boardHero) {
			// update values inside the tile
			boardHero.board = this;
			boardHero.heroPosX = x;
			boardHero.heroPosY = y;
			boardHero.bitmap.x = this.heroSize * x;
			boardHero.bitmap.y = this.heroSize * y;
			// add the bitmap to the display list
			this.container.addChild(boardHero.bitmap);
		}
	},

	/**
	 * A convenience method to set a tile at a location by only
	 * specifying the tile type. The BoardHero is created and then
	 * setTileWithExisting is called.
	 * 
	 * @param {integer} x Tile position on the x-axis.
	 * @param {integer} y Tile position on the y-axis.
	 * @param {TileType} tileType The type of tile to place.
	 */
	setTile : function (x, y, hero) {
		this.setHeroWithExisting(x, y, new BoardHero(hero, this));
	},
});