var Board = new Class({
	tiles : null,
	numWide : null,
	numHigh : null,
	tileSize : null,
	container : null,

	/**
	 * Constructor method.
	 * 
	 * @constructor
	 * @param  {integer} numWide Number of tiles wide.
	 * @param  {integer} numHigh Number of tiles high.
	 * @param {TileType[][]} tiles A pre-initialized 2D tile array.
	 */
	initialize : function (numWide, numHigh, tileSize, tiles) {
		this.numWide = numWide;
		this.numHigh = numHigh;
		this.tileSize = tileSize;
		this.container = new createjs.Container();
		if (tiles) {
			this.setAllTiles(tiles);
		} else {
			// initialize tiles as empty array with the specified numWide and numHigh
			this.tiles = new Array(numHigh);
			for (var i = 0; i < numHigh; i++) {
				this.tiles[i] = new Array(numWide);
			}
		}
	},

	/**
	 * Gets the tile from the board at the specified location.
	 * 
	 * @param  {integer} x Coordinate on the x-axis.
	 * @param  {integer} y Coordinate on the y-axis.
	 * @return {BoardTile} The tile at that location.
	 */
	getTile : function (x, y) {
		return tiles[y][x];
	},

	/**
	 * Sets the tile at the specified location.
	 * This method is useful to reuse existing BoardTile instances.
	 * 
	 * @param  {integer} x Tile position on the x-axis.
	 * @param  {integer} y Tile position on the y-axis.
	 * @param  {BoardTile} boardTile The tile to set.
	 */
	setTileWithExisting : function (x, y, boardTile) {
		var oldTile = this.tiles[y][x];
		if (oldTile) {
			// remove the old bitmap from display list
			this.container.removeChild(oldTile.bitmap);
		}
		this.tiles[y][x] = boardTile;
		if (boardTile) {
			// update values inside the tile
			boardTile.board = this;
			boardTile.tilePosX = x;
			boardTile.tilePosY = y;
			boardTile.bitmap.x = this.tileSize * x;
			boardTile.bitmap.y = this.tileSize * y;
			// add the bitmap to the display list
			this.container.addChild(boardTile.bitmap);
		}
	},

	/**
	 * A convenience method to set a tile at a location by only
	 * specifying the tile type. The BoardTile is created and then
	 * setTileWithExisting is called.
	 * 
	 * @param {integer} x Tile position on the x-axis.
	 * @param {integer} y Tile position on the y-axis.
	 * @param {TileType} tileType The type of tile to place.
	 */
	setTile : function (x, y, tileType) {
		this.setTileWithExisting(x, y, new BoardTile(tileType, this));
	},

	/**
	 * Resets all tiles on the board based on the given tile types.
	 * 
	 * @param {TileType[][]} tiles A pre-initialized 2D tile array.
	 */
	setAllTiles : function (tiles) {
		// make sure the sizes match
		if (tiles.length != this.numHigh || tiles[0].length != this.numWide) {
			// Note: we only check the first row as an optimization
			throw "Tiles array sizes do not match numWide and numHigh attributes";
		}
		// remove all children from display list
		this.container.removeAllChildren();
		for (var y = 0; y < tiles.length; y++) {
			var row = tiles[y];
			for (var x = 0; x < row.length; x++) {
				var tileType = row[x];
				if (tileType) {
					this.setTile(x, y, tileType);
				} else {
					// set undefined entry
					this.setTileWithExisting(x, y, tileType);
				}
			}
		}
	}
});