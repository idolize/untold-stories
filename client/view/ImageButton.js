var ImageButton = new Class({
	Implements: Events,

	type: null,
	element: null,
	tooltip: null,

	initialize: function(type, isTile) {
		this.type = type;

		this._clickedFunc = function(event) {
			this.fireEvent('click', event);
		}.bind(this);

		// Note: Chrome seems to re-request the image every time the tab changes when using
		// <input type="image"> so we must use an img tag instead to avoid this. This makes
		// enabling/disabiling the button more compilcated, however, as we must manually
		// style the button and disable/enable listeners.
		this.element = new Element('img', { src: type.image.src }); // copy the image
		this.element.addClass('imgBtn');
		this.element.addClass('object');
		this.setEnabled(true);
	},

	setEnabled: function(enabled) {
		if (enabled) {
			this.element.removeClass('disabled');
			this.element.addEvent('click', this._clickedFunc);
			this.tooltip = new mBox.Tooltip({
				content: ('"'+this.type.id+'"'),
				theme: 'Black',
				attach: this.element
			});
		} else {
			this.element.addClass('disabled');
			this.element.removeEvent('click', this._clickedFunc);
			this.tooltip.destroy();
			this.element.removeEvents('mouseenter');
		}
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