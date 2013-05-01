var TextBox = new Class({
	text: null,
	domElement: null,
	pos: null,
	isAction: null,

	initialize: function(domNode, text, x, y, isAction) {
		this.text = text;
		this.pos = { x: x, y: y };
		this.domElement = new createjs.DOMElement(domNode);
		this.domElement.x = x;
		this.domElement.y = y;
		this.isAction = isAction || false;
	},
});