/**
 * Perform all DOM manipulation in this top level function (by listening to events from app or app.game).
 * @see  <a href="http://mootools.net/docs/core/Element/Element">MooTools Element class</a> for DOM tools.
 */
function loaded() {
	var canvas = document.id('gamecanvas');
	var leftInfo = document.id('leftinfo');
	var rightInfo = document.id('rightinfo');
	var tabs;
	var topRight = {
		y: 'top',
		x: 'right'
	};

	// create waiting popup and animation
	var waitingTextArea = new Element('div');
	new Element('p', {
		text: 'Waiting for other player...'
	}).inject(waitingTextArea);
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
		content: '<p class="startprompt">How do you want to play the game?</p>',
		target: 'gamecanvas',
		buttons: [{
			title: 'Player',
			id: 'startPlayerBtn',
			event: function() {
				this.close();
				beginGame(false);
			}
		}, {
			title: 'Creator',
			id: 'startCreatorBtn',
			event: function() {
				this.close();
				beginGame(true);
			}
		}],
		attach: 'play' // attach this dialog to the play button's onClick handler
	});
	// add tooltips for the buttons
	new mBox.Tooltip({
		content: 'Act as the player, controlling the hero and interacting with whatever happens along this crazy story.',
		theme: 'Black',
		width: 150,
		position: {
			x: 'left',
			y: 'center'
		},
		attach: 'startPlayerBtn'
	});
	new mBox.Tooltip({
		content: 'Act as the creator, creating the entire game world piece by piece. You are the core storyteller of the game.',
		theme: 'Black',
		width: 150,
		position: {
			x: 'right',
			y: 'center'
		},
		attach: 'startCreatorBtn'
	});	

	document.id('play').erase('disabled');
	// create the app
	var app = new App(canvas);



	/**
	 * Sets everything in motion for the entire application and game.
	 */
	function beginGame(isCreator) {
		// show waiting animation
		showWaiting(true);

		var endBtn, creatorHelpBtn, playerHelpBtn; // relevant DOM
		var toolbar, selector; // panels

		function activatePanels(active) {
			toolbar.setEnabled(active);
			if (isCreator) selector.setEnabled(active);
		}

		// setup callbacks for our custom events
		function onTurnStarted() {
			endBtn.erase('disabled');
			activatePanels(true);
			canvas.getParent().addClass('active');
			showNotice('info', 'Your turn has started');
			rightInfo.textContent = 'Active';
		}

		function onTurnEnded() {
			endBtn.set('disabled', 'disabled');
			activatePanels(false);
			canvas.getParent().removeClass('active');
			rightInfo.textContent = 'Waiting';
		}

		function onConnectFailed() {
			if (app) app.destroy(); // reset entire app state
			showWaiting(false);
			// display failure message
			showNotice('error', 'Socket connection failed');
		}

		function onDisconnected() {
			// display failure message
			showNotice('error', 'Socket disconnected');
			disableCanvas();
		}

		function onJoinFailed(cause) {
			// stop waiting animation
			showWaiting(false);
			// display the failure message
			showNotice('notice', cause.msg);
		}

		function onOtherPlayerDisconnected() {
			// display message
			showNotice('notice', 'Other player disconnected');
			disableCanvas();
		}

		function onGameStarted(game) {
			// remove our event listener for joinFailed
			app.removeEvent('joinFailed', onJoinFailed);
			// stop waiting animation
			showWaiting(false);
			// remove the play button
			document.id('play').dispose();

			showNotice('info', ('Game started. You are the ' + (game.isCreator ? 'creator' : 'player') + '.'));
			leftInfo.textContent = (game.isCreator ? 'Creator' : 'Player');
			rightInfo.textContent = 'Waiting';

			// handle all requests to create textboxes and actions
			var constructTextbox = function(text, isAction) {
				var element = new Element('p', {
					'class': 'textbox' + (isAction? ' action' : ''),
					style: { display: 'none' },
					text: text	
				});
				element.inject('textcontainer');
				return element;
			};
			app.game.addEvent('constructTextboxFromOtherClient', function(textbox) {
				var element = constructTextbox(textbox.text, false);
				app.game.addTextbox(element, textbox.text, textbox.x, textbox.y, !isCreator, true);
			});
			app.game.addEvent('constructActionFromOtherClient', function(textbox) {
				var element = constructTextbox(textbox.text, true);
				app.game.placeAction(element, textbox.text, textbox.x, textbox.y, true);
			});
			var textboxPrompt = new TextboxPrompt(canvas);
			app.addEvent('textboxCreateRequest', function(pos) {
				if (!isCreator && app.game.playerTextbox != null) {
					// this is a player attempting to place a second textbox
					// TODO move the current textbox to the new location or disable the button
					showNotice('info', 'The player can only have one textbox per turn');
				} else {
					textboxPrompt.openPrompt(pos, false, function(text) {
						var textNode = constructTextbox(text, false);
						app.game.addTextbox(textNode, text, pos.x, pos.y, isCreator);
					});
				}
			});
			app.addEvent('actionCreateRequest', function(pos) {
				if (!isCreator && app.game.actionBox != null) {
					// this is a player attempting to place a second textbox
					// TODO move the current textbox to the new location or disable the button
					showNotice('info', 'The player can only have one action per turn');
				} else {
					textboxPrompt.openPrompt(pos, true, function(text) {
						var textNode = constructTextbox(text, true);
						app.game.placeAction(textNode, text, pos.x, pos.y);
					});
				}
			});


			// show the toolbar
			toolbar = new ToolbarPanel(isCreator);
			toolbar.addEvent('deleteClicked', function() {
				if (isCreator) {
					app.setActionMode(App.ActionMode.DELETE);
				} else {
					showNotice('info', 'This feature has not been implemented yet'); //TODO
				}
			});
			toolbar.addEvent('moveClicked', function() {
				showNotice('info', 'This feature has not been implemented yet'); //TODO
			});

			toolbar.addEvent('textboxClicked', function() {
				app.setActionMode(App.ActionMode.TEXT);
			});
			if (isCreator) {
				// edit button clicked
				toolbar.addEvent('editClicked', function() {
					showNotice('info', 'This feature has not been implemented yet'); //TODO
				});
				// clear button clicked and confirmed
				toolbar.addEvent('clearClicked', function() {
					app.game.clearScreen();
				});
			} else {
				// insert action button clicked
				toolbar.addEvent('actionClicked', function() {
					app.setActionMode(App.ActionMode.ACTION);
				});
			}
			toolbar.show();


			// show the selector
			if (isCreator) {
				// retrieve all available tile and object types
				var tileTypes = globals.tileIds.map(function(id){ return app.game.getTileTypeInstance(id); });
				var objectTypes = globals.objectIds.map(function(id){ return app.game.getObjectTypeInstance(id); });

				// create the selector
				selector = new SelectorPanel(tileTypes, objectTypes);
				var imgBtnClicked = function(imgBtn) {
					app.setActionMode(App.ActionMode.PLACE, imgBtn.type);
				};
				selector.addEvent('tileBtnClicked', imgBtnClicked);
				selector.addEvent('objBtnClicked', imgBtnClicked);
				selector.show();

				// if the selection changes in one panel make sure it clears any selection in the other
				selector.addEvent('selectionChanged', function(newBtn) {
					toolbar.clearSelectedBtn();
				});
				toolbar.addEvent('selectionChanged', function(newBtn) {
					selector.clearSelectedBtn();
				});
			}

			// select the initial tool for each player
			toolbar.clickBtn('textbox');

			// show the 'end turn button'
			endBtn = new Element('button', {
				text: 'End turn',
				'class': 'btn red',
				disabled: 'disabled',
				events: { click: app.endTurn },
				id: 'endturn'
			});
			endBtn.inject('bottom');

			var tutorial = new Tutorial(isCreator);

			var tutorialBtn = new Element('button', {
				text: 'Tutorial',
				'class': 'btn lime',
				events: {
					click: tutorial.start
				},
				id: 'tutorialBtn'
			});
			tutorialBtn.inject('bottom');

			activatePanels(false); // initially disable everything until a turn starts

			// now listen for turn events
			app.addEvent('turnStarted', onTurnStarted);
			app.addEvent('turnEnded', onTurnEnded);
			app.addEvent('otherPlayerDisconnected', onOtherPlayerDisconnected);
		}

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
		app.connect(':' + globals.wsPort);
	}

	/**
	 * Shows or hides the waiting notice modal.
	 * @param  {boolean} show If the notice should be shown or hidden.
	 */
	function showWaiting(show) {
		if (show) {
			waitingPopup.open();
			waitingAnim.start();
		} else {
			waitingAnim.stop();
			waitingPopup.close();
		}
	}

	/**
	 * Shows a notice in the top right of the screen.
	 * @param  {String} type The type of message to display, which affects the icon.
	 *                       Can be either 'alert', 'info', 'error', 'ok', or 'default' (no icon).
	 * @param  {String} msg  The message, or content, of the notice.
	 */
	function showNotice(type, msg) {
		new mBox.Notice({
			type: type,
			position: topRight,
			content: msg
		});
	}

	/**
	 * Makes the canvas appear dim and unusable to the user.
	 */
	function disableCanvas() {
		canvas.getParent().addClass('done');
	}
}
window.addEvent('domready', loaded); // call when everything has loaded
