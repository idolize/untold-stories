var easeljs = require('easeljs');

function Grid(tileBoard) {
  var graphics = new easeljs.Graphics();
  graphics.setStrokeStyle(1);
  graphics.beginStroke(easeljs.Graphics.getRGB(255,255,255));
  
  var tileSize = tileBoard.tileSize;
  var width = tileBoard.numWide * tileSize;
  var height = tileBoard.numHigh * tileSize;
  for (var y = 0; y <= width; y+= tileSize) {
    graphics.moveTo(y, 0);
    graphics.lineTo(y, height);
  }
  for (var x = 0; x <= height; x+= tileSize) {
    graphics.moveTo(0, x);
    graphics.lineTo(width, x);
  }

  this.shape = new easeljs.Shape(graphics);
  this.shape.alpha = 0.5;
  this.shape.snapToPixel = true;
  this.shape.cache(0, 0, width, height);
}

module.exports = Grid;