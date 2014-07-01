var MouseHandler = new Class({
	Implements: Events,
	Binds: ['_mouseDownHandler', '_mouseMoveHandler', '_mouseUpHandler'],

	//TODO use this instead http://www.createjs.com/tutorials/easeljs/Mouse%20Interaction/

	canvas: null,
	tileSize: null,
	isMouseDown: null,
	canvasPos: null,
	boardPos: null,

	initialize: function(canvas, tileSize) {
		this.canvas = canvas;
		this.tileSize = tileSize;
		this.isMouseDown = false;
		this.boardPos = { x: -1, y: -1 };
		this.canvasPos = { x: -1, y: -1 };
	},

	startListening: function() {
		this._stop = false;
		this.canvas.addEvent('mousedown', this._mouseDownHandler);
		this.canvas.addEvent('mousemove', this._mouseMoveHandler);
		window.addEvent('mouseup', this._mouseUpHandler);
	},

	stopListening: function() {
		this.isMouseDown = false;
		this.canvas.removeEvent('mousedown', this._mouseDownHandler);
		this.canvas.removeEvent('mousemove', this._mouseMoveHandler);
		window.removeEvent('mouseup', this._mouseUpHandler);
	},

	_mouseDownHandler: function(event) {
		var canvasTopLeft = this.canvas.getPosition();
		this.canvasPos.x = event.page.x - canvasTopLeft.x;
		this.canvasPos.y = event.page.y - canvasTopLeft.y;
		this.fireEvent('clickCanvas', Object.clone(this.canvasPos)); // alert listeners of the global pos

		// convert to board coordinates
		this.boardPos.x = Math.floor(this.canvasPos.x / this.tileSize);
		this.boardPos.y = Math.floor(this.canvasPos.y / this.tileSize);
		this.fireEvent('clickBoard', Object.clone(this.boardPos)); // alert listeners of the local board pos

		this.isMouseDown = true;
	},

	_mouseMoveHandler: function(event) {
		if (this.isMouseDown) {
			var canvasTopLeft = this.canvas.getPosition();
			var canvasPosX = event.page.x - canvasTopLeft.x;
			var canvasPosY = event.page.y - canvasTopLeft.y;

			if (canvasPosX != this.canvasPos.x || canvasPosY != this.canvasPos.y) {
				this.canvasPos.x = canvasPosX;
				this.canvasPos.y = canvasPosY;
				this.fireEvent('clickHoldCanvas', this.canvasPos);
			}

			// convert to board coordinates
			var boardPosX = Math.floor(this.canvasPos.x / this.tileSize);
			var boardPosY = Math.floor(this.canvasPos.y / this.tileSize);

			if (boardPosX != this.boardPos.x || boardPosY != this.boardPos.y) {
				this.boardPos.x = boardPosX;
				this.boardPos.y = boardPosY;
				this.fireEvent('clickHoldBoard', this.boardPos); // this event will fire much less frequently than the previous
			}
		}
	},

	_mouseUpHandler: function(event) {
		var canvasTopLeft = this.canvas.getPosition();
		this.canvasPos.x = event.page.x - canvasTopLeft.x;
		this.canvasPos.y = event.page.y - canvasTopLeft.y;
		this.boardPos.x = Math.floor(this.canvasPos.x / this.tileSize);
		this.boardPos.y = Math.floor(this.canvasPos.y / this.tileSize);
		this.isMouseDown = false;
		this.fireEvent('clickReleasedCanvas', this.canvasPos);
		this.fireEvent('clickReleasedBoard', this.boardPos);
	}	
});
