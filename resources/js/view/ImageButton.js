var ImageButton = new Class({
	Implements: Events,

	type: null,
	element: null,
	tooltip: null,

	initialize: function(type, isTile) {
		this.type = type;

		var clickedFunc = function(event) {
			this.fireEvent('click', event);
		}.bind(this);

		this.element = new Element('input', {
			type: 'image',
			src: type.image.src
		});
		this.element.addClass('imgBtn');
		this.element.addClass('object');
		this.element.addEvent('click', clickedFunc);
		this.tooltip = new mBox.Tooltip({
			content: ('"'+type.id+'"'),
			theme: 'Black',
			attach: this.element
		});
	},

	setEnabled: function(enabled) {
		if (enabled) this.element.erase('disabled');
		else this.element.set('disabled', 'disabled');
	},

	destroy: function() {
		this.element.removeEvents();
		this.element.destroy();
		this.tooltip.destroy();
	},

	toElement: function() {
		return this.element;
	}
});