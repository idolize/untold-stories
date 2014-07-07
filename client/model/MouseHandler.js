var $ = require('jquery');
var util = require('util');
var events = require('events');

var mouseDownHandlerBound, mouseUpHandlerBound, mouseMoveHandlerBound;

function MouseHandler(stage, tileSize) {
  this.stage = stage;
  this.tileSize = tileSize;
  this.isMouseDown = false;
  this.boardPos = { x: -1, y: -1 };
  this.canvasPos = { x: -1, y: -1 };
}
util.inherits(MouseHandler, events.EventEmitter);
module.exports = MouseHandler;

MouseHandler.prototype.startListening = function() {
  this.stage.enableDOMEvents(true);
  mouseDownHandlerBound = this.stage.on('stagemousedown', mouseDownHandler, this);
  mouseUpHandlerBound = this.stage.on('stagemouseup', mouseUpHandler, this);
  mouseMoveHandlerBound = this.stage.on('stagemousemove', mouseMoveHandler, this);
};

MouseHandler.prototype.stopListening = function() {
  this.stage.enableDOMEvents(false);
  this.isMouseDown = false;
  this.stage.off('stagemousedown', mouseDownHandlerBound);
  this.stage.off('stagemouseup', mouseUpHandlerBound);
  this.stage.off('stagemousemove', mouseMoveHandlerBound);
};


function mouseDownHandler(event) {
  this.canvasPos.x = event.stageX;
  this.canvasPos.y = event.stageY;
  this.emit('clickCanvas', Object.clone(this.canvasPos)); // alert listeners of the global pos

  // convert to board coordinates
  this.boardPos.x = Math.floor(this.canvasPos.x / this.tileSize);
  this.boardPos.y = Math.floor(this.canvasPos.y / this.tileSize);
  this.emit('clickBoard', Object.clone(this.boardPos)); // alert listeners of the local board pos

  this.isMouseDown = true;
}

function mouseMoveHandler(event) {
  if (this.isMouseDown) {
    if (event.stageX != this.canvasPos.x || event.stageY != this.canvasPos.y) {
      this.canvasPos.x = event.stageX;
      this.canvasPos.y = event.stageY;
      this.emit('clickHoldCanvas', this.canvasPos);
    }

    // convert to board coordinates
    var boardPosX = Math.floor(this.canvasPos.x / this.tileSize);
    var boardPosY = Math.floor(this.canvasPos.y / this.tileSize);

    if (boardPosX != this.boardPos.x || boardPosY != this.boardPos.y) {
      this.boardPos.x = boardPosX;
      this.boardPos.y = boardPosY;
      this.emit('clickHoldBoard', this.boardPos); // this event will fire much less frequently than the previous
    }
  }
}

function mouseUpHandler(event) {
  this.canvasPos.x = event.stageX;
  this.canvasPos.y = event.stageY;
  this.boardPos.x = Math.floor(this.canvasPos.x / this.tileSize);
  this.boardPos.y = Math.floor(this.canvasPos.y / this.tileSize);
  this.isMouseDown = false;
  this.emit('clickReleasedCanvas', this.canvasPos);
  this.emit('clickReleasedBoard', this.boardPos);
}