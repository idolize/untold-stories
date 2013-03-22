/**
 * Perform all DOM manipulation in this top level function (by listening to events from app or app.game).
 * @see  <a href="http://mootools.net/docs/core/Element/Element">MooTools Element class</a> for DOM tools.
 */
function loaded() {
	var canvas = document.id('gamecanvas');
	// create waiting popup and animation
	var waitingTextArea = new Element('div');
	new Element('p', {html: 'Waiting for other player...'}).inject(waitingTextArea);
	var waitingAnim = new MUX.Loader.Bar();
	waitingAnim.elem.inject(waitingTextArea);
	var waitingPopup = new mBox({
		content: waitingTextArea,
		overlay: true,
		closeOnEsc: false,
		closeOnBodyClick: false,
		closeOnMouseleave: false
	});
	// create join game dialog
	var joinModal = new mBox.Modal({
		title: 'Join a game',
		content: 'Select what you wish to play as...',
		buttons: [
			{ title: 'Player',
				event: function() {
					this.close();
					begin(false);
				}
			},
			{ title: 'Creator',
				event: function() {
					this.close();
					begin(true);
				}
			}
		],
		attach: 'play' // attach this dialog to the play button's onClick handler
	});
	// create notification objects
	var top_right = { y: 'top', x: 'right'};


	function begin(isCreator) {
		// show waiting animation
		waitingPopup.open();
		waitingAnim.start();

		// start the app
		var app = new App(canvas, isCreator);
		app.connect();

		// setup callbacks for our custom events
		// NOTE it is the event listener's responsibility (not the event generator's) to remove any listeners it registers
		var onJoinFailed = function(cause) {
			// remove all event listeners since we are going to discard app instance anyway
			app.removeEvents();
			app = null;
			// stop waiting animation
			waitingAnim.stop();
			waitingPopup.close();
			// display the failure message
			showNotice('notice', cause.msg);
		};
		var onGameStarted = function(game) {
			// remove our event listener for joinFailed
			app.removeEvent('joinFailed', onJoinFailed);
			// stop and remove waiting animation
			waitingAnim.stop();
			waitingAnim.elem.dispose();
			waitingPopup.close();
			// remove the play button
			document.id('play').dispose();
			showNotice('info', ('Game started. You are the ' + (game.isCreator ? 'creator' : 'player') + '.'));
		};
		app.addEvent('joinFailed', onJoinFailed);
		app.addEvent('gameStarted', onGameStarted);

		// ok to attempt to join the server
		app.join();
	}

	function showNotice(type, msg) {
		new mBox.Notice({
			type: type,
			position: top_right,
			content: msg
		});
	}
}
window.addEvent('domready', loaded); // call when everything has loaded