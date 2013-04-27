/**
 * Perform all DOM manipulation in this top level function (by listening to events from app or app.game).
 * @see  <a href="http://mootools.net/docs/core/Element/Element">MooTools Element class</a> for DOM tools.
 */
function loaded() {
	var canvas = document.id('gamecanvas');
	var leftInfo = document.id('leftinfo');
	var rightInfo = document.id('rightinfo');
	var topRight = { y: 'top', x: 'right' };
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
					beginGame(false);
				}
			},
			{ title: 'Creator',
				event: function() {
					this.close();
					beginGame(true);
				}
			}
		],
		attach: 'play' // attach this dialog to the play button's onClick handler
	});
	document.id('play').erase('disabled');
	var endBtn;
	// create the app
	var app = new App(canvas);

	function beginGame(isCreator) {
		// show waiting animation
		showWaiting(true);

		// setup callbacks for our custom events
		var onTurnStarted = function() {
			endBtn.erase('disabled');
			document.id('textbox').erase('disabled');

			if (app.game.textFromOtherPlayer) {
				document.id('textlog').grab(new Element('p', {html: ((app.game.isCreator ? 'Player' : 'Creator') + ': ' + app.game.textFromOtherPlayer)}));
			}

			showNotice('info', 'Your turn has started');
			rightInfo.textContent = 'Active';
		};
		var onTurnEnded = function() {
			endBtn.set('disabled', 'disabled');
			var textbox = document.id('textbox');
			textbox.set('disabled', 'disabled');
			var textboxval = textbox.get('value');
			if (textboxval) document.id('textlog').grab(new Element('p', {html: ('Me: ' + textboxval)}));
			textbox.set('value', '');
			rightInfo.textContent = 'Waiting';
		};
		var onConnectFailed = function() {
			if (app) app.destroy();
			showWaiting(false);
			// display failure message
			showNotice('error', 'Socket connection failed');
		};
		var onDisconnected = function() {
			// display failure message
			showNotice('error', 'Socket disconnected');
		};
		var onJoinFailed = function(cause) {
			// stop waiting animation
			showWaiting(false);
			// display the failure message
			showNotice('notice', cause.msg);
		};
		var onOtherPlayerDisconnected = function() {
			// display message
			showNotice('notice', 'Other player disconnected');
		};
		var onGameStarted = function(game) {
			// remove our event listener for joinFailed
			app.removeEvent('joinFailed', onJoinFailed);
			// stop waiting animation
			showWaiting(false);
			// remove the play button
			document.id('play').dispose();
			showNotice('info', ('Game started. You are the ' + (game.isCreator ? 'creator' : 'player') + '.'));
			leftInfo.textContent = (game.isCreator ? 'Creator' : 'Player');
			rightInfo.textContent = 'Waiting';

			// show the textbox and log
			var textlog = new Element('div', {
				style: 'margin: 0 auto; width: 780px; overflow-y: scroll; height: 100px; border: 1px solid gray; padding: 10px; font-size: 0.8em',
				id: 'textlog'
			});
			textlog.inject('middle');
			var textbox = new Element('input', {
				value: '',
				disabled: 'disabled',
				placeholder: 'Enter a message or action for your turn',
				style: 'display: block; margin: 10px auto; width: 800px;',
				id: 'textbox'
			});
			textbox.inject('middle');

			// show the 'end turn button'
			endBtn = new Element('button', {
				html: 'End turn',
				'class': 'btn red',
				disabled: 'disabled',
				events: {
					click: function() {
						app.game.stateChanges['textbox'] = textbox.get('value');
						app.endTurn();
					}
				},
				id: 'endturn'
			});
			endBtn.inject('bottom');
			// now listen for turn events
			app.addEvent('turnStarted', onTurnStarted);
			app.addEvent('turnEnded', onTurnEnded);
			app.addEvent('otherPlayerDisconnected', onOtherPlayerDisconnected);
		};

		app.addEvent('connected', function() {
			// listen for response to join request
			app.addEvent('joinFailed', onJoinFailed);
			app.addEvent('gameStarted', onGameStarted);
			// ok to begin attempt to join the server
			app.join(isCreator);
		});
		app.addEvent('connectFailed', onConnectFailed);
		app.addEvent('disconnected', onDisconnected);

		// start the app
		app.connect(':'+globals.wsPort);
	}

	function showWaiting(show) {
		if (show) {
			waitingPopup.open();
			waitingAnim.start();
		} else {
			waitingAnim.stop();
			waitingPopup.close();
		}
	}

	function showNotice(type, msg) {
		new mBox.Notice({
			type: type,
			position: topRight,
			content: msg
		});
	}
}
window.addEvent('domready', loaded); // call when everything has loaded