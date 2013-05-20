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
		this.domElement.htmlElement.style.display = 'block'; // begin rendering
	},

	// see: toElement section of http://mootools.net/blog/2010/03/19/a-better-way-to-use-elements/
	toElement: function() {
		return this.domElement;
	}
});