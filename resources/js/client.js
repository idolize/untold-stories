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
		html: 'Waiting for other player...'
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
		content: 'Select what you wish to play as...',
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
	var endBtn;
	var toolbarBox;
	var selectorBox;
	var creatorHelpBtn;
	var playerHelpBtn;
	// create the app
	var app = new App(canvas);

	/** Sets everything in motion for the entire application and game. */

	function beginGame(isCreator) {
		// show waiting animation
		showWaiting(true);

		// setup callbacks for our custom events
		var onTurnStarted = function() {
			endBtn.erase('disabled');
			document.id('textbox').erase('disabled');

			if (app.game.textFromOtherPlayer) {
				document.id('textlog').grab(new Element('p', {
					html: ((app.game.isCreator ? 'Player' : 'Creator') + ': ' + app.game.textFromOtherPlayer)
				}));
			}
			showNotice('info', 'Your turn has started');
			rightInfo.textContent = 'Active';
		};
		var onTurnEnded = function() {
			endBtn.set('disabled', 'disabled');
			var textbox = document.id('textbox');
			textbox.set('disabled', 'disabled');
			var textboxval = textbox.get('value');
			if (textboxval) document.id('textlog').grab(new Element('p', {
				html: ('Me: ' + textboxval)
			}));
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

			// show the tile and object selector
			if (isCreator) {
				var toolbarContent = new Element('div', { id: 'toolbarContent' });
				var clearBtn = new Element('input', {
					type: 'image',
					src: '../images/tools/clear.png',
					events: {
						click: function() {
							if (app.game.active) app.game.clearScreen(true);
						}
					}
				});
				new mBox.Tooltip({
					content: 'Clear the world',
					theme: 'Black',
					attach: clearBtn
				});
				clearBtn.inject(toolbarContent);
				var deleteBtn = new Element('input', {
					type: 'image',
					src: '../images/tools/delete.png',
					events: {
						click: function() {
							console.log('TODO: Implement delete object functionality'); //TODO
						}
					}
				});
				new mBox.Tooltip({
					content: 'Delete an object',
					theme: 'Black',
					attach: deleteBtn
				});
				deleteBtn.inject(toolbarContent);
				var editBtn = new Element('input', {
					type: 'image',
					src: '../images/tools/edit.png',
					events: {
						click: function() {
							console.log('TODO: Implement edit object functionality'); //TODO
						}
					}
				});
				new mBox.Tooltip({
					content: 'Edit an object',
					theme: 'Black',
					attach: editBtn
				});
				editBtn.inject(toolbarContent);

				toolbarBox = new mBox({
					title: 'Toolbar',
					content: toolbarContent,
					width: 100,
					height: 200,
					draggable: true,
					target: 'main',
					addClass: {
						'title': 'paneltitle'
					},
					position: {
						x: ['left', 'outside'],
						y: ['center'],
					},
					offset: {
						x: -10,
						y: -5,
					},
					closeOnEsc: false,
					closeOnClick: false,
					closeOnBodyClick: false,
					closeOnMouseleave: false,
					openOnInit: true,
					zIndex: 7000,
					id: 'toolbarBox'
				});

				// TODO? would be *super* cool to use this for our selector: http://mcpants.github.io/jquery.shapeshift/
				var selectorTabs = new Element('div', { id: 'selectorTabs' });
				var tabsList = new Element('ul', { 'class': 'tabs' });
				tabsList.grab(new Element('li', { html: 'Tiles' }));
				tabsList.grab(new Element('li', { html: 'Objects' }));
				var contentsList = new Element('ul', { 'class': 'contents' });
				contentsList.grab(new Element('li', { id: 'tileSelect' }));
				contentsList.grab(new Element('li', { id: 'objectSelect' }));
				selectorTabs.grab(tabsList);
				selectorTabs.grab(contentsList);
				selectorBox = new mBox({
					title: 'Tiles and Objects',
					content: selectorTabs,
					width: 200,
					draggable: true,
					target: 'main',
					addClass: {
						'title': 'paneltitle'
					},
					position: {
						x: ['right', 'outside'],
						y: ['center'],
					},
					offset: {
						x: 10,
						y: -5,
					},
					closeOnEsc: false,
					closeOnClick: false,
					closeOnBodyClick: false,
					closeOnMouseleave: false,
					openOnInit: true,
					zIndex: 7000,
					id: 'selectorBox'
				});
				tabs = new TinyTab(tabsList.getChildren(), contentsList.getChildren());

				// buttons for objects
				var prevImgBtn = null;
				for (var i = 0; i < globals.objectIds.length; i++) {
					var id = globals.objectIds[i];
					var objectBtn = new Element('input', {
						type: 'image',
						src: 'images/objects/' + id + '.png',
						'class': 'imgBtn tile',
						events: {
							click: function() {
								this.addClass('selected');
								if (prevImgBtn) prevImgBtn.removeClass('selected');
								prevImgBtn = this;
								// update the game state
								app.game.setCurrentObjectType(this['objectId']);
							}
						}
					});
					objectBtn['objectId'] = id, //TODO this is hacky
					objectBtn.inject('objectSelect');
					new mBox.Tooltip({
						content: ('Object "'+id+'"'),
						theme: 'Black',
						attach: objectBtn
					});
				}
				// buttons for tiles
				for (var i = 0; i < globals.tileIds.length; i++) {
					var id = globals.tileIds[i];
					var tileBtn = new Element('input', {
						type: 'image',
						src: 'images/tiles/' + id + '.png',
						'class': 'imgBtn object',
						events: {
							click: function() {
								this.addClass('selected');
								if (prevImgBtn) prevImgBtn.removeClass('selected');
								prevImgBtn = this;
								// update the game state
								app.game.setCurrentTileType(this['tileId']);
							}
						}
					});
					tileBtn['tileId'] = id, //TODO this is hacky
					tileBtn.inject('tileSelect');
					new mBox.Tooltip({
						content: ('Tile "'+id+'"'),
						theme: 'Black',
						attach: tileBtn
					});
				}
			}

			// show the textbox and log
			var textlog = new Element('div', {
				style: 'margin: 0 auto; width: 460px; overflow-y: scroll; height: 100px; border: 1px solid gray; padding: 10px; font-size: 0.8em',
				id: 'textlog'
			});
			textlog.inject('middle');
			var textbox = new Element('input', {
				value: '',
				disabled: 'disabled',
				placeholder: 'Enter a message or action for your turn',
				style: 'display: block; margin: 10px auto; width: 480px;',
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

			var tutorialBtn = new Element('button', {
				html: 'Tutorial',
				'class': 'btn lime',
				events: {
					click: (isCreator ? startCreatorIntro : startPlayerIntro)
				},
				id: 'tutorialBtn'
			});
			tutorialBtn.inject('bottom');

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
}
window.addEvent('domready', loaded); // call when everything has loaded