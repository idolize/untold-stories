var TextboxPrompt = new Class({
	Implements: Events,

	modal: null,
	pos: null,
	isAction: null,
	callback: null,

	initialize: function(target) {
		var prompt = this;
		var content = new Element('div', {
			style: { width: '213px'}
		});
		var textbox = new Element('textarea', {
			style: { width: '200px', 'margin-top': '5px' },
			cols: 30,
			rows: 3
		});
		textbox.inject(content);

		this.modal = new mBox.Modal({
				content: content,
				title: 'Enter your text',
				closeOnBodyClick: false,
				position: { x: ['left', 'inside'], y: ['top', 'inside'] },
				fade: false,
				onOpen: function() {
					// change title
					this.setTitle(prompt.isAction ? 'Enter your action' : 'Enter your dialog');
					// position at the cursor
					this.setPosition(target, this.options.position, { x: prompt.pos.x, y: prompt.pos.y });
					setTimeout(function() { textbox.focus(); }, 10); // focus the textarea
				},
				onClose: function() {
					prompt.removeEvent('added', prompt.callback);
				},
				buttons: [
					{ title: 'Cancel' },
					{
						title: 'Add',
						addClass: 'button_green',
						event: function() {
							var text = textbox.get('value');
							textbox.set('value', '');
							prompt.fireEvent('added', text);
							this.close();
						}
					}
				]
			});
	},

	openPrompt: function(pos, isAction, callback) {
		this.pos = pos;
		this.isAction = isAction;
		this.callback = callback;

		this.addEvent('added', this.callback);
		this.modal.open();
	}
});