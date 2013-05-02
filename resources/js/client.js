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

	/** Sets everything in motion for the entire application and game. */
	function beginGame(isCreator) {
		// show waiting animation
		showWaiting(true);

		var endBtn, toolbarBox, selectorBox, creatorHelpBtn, playerHelpBtn; // relevant DOM
		var toolbarBtns = {}; // hash set: key=instance name, value=instance
		var activateToolbar = function(active) {
			Object.each(toolbarBtns, function(btn, btnName) {
				if (active) btn.erase('disabled');
				else btn.set('disabled', 'disabled');
			});
		};

		// setup callbacks for our custom events
		var onTurnStarted = function() {
			endBtn.erase('disabled');
			activateToolbar(true);
			canvas.getParent().addClass('active');
			showNotice('info', 'Your turn has started');
			rightInfo.textContent = 'Active';
		};
		var onTurnEnded = function() {
			endBtn.set('disabled', 'disabled');
			activateToolbar(false);
			canvas.getParent().removeClass('active');
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

			var constructTextbox = function(text, isAction) {
				var element = new Element('p', {
					'class': 'textbox' + (isAction? ' action' : ''),
					style: { display: 'none' },
					text: text	
				});
				element.inject('textcontainer');
				return element;
			};
			app.game.addEvent('textboxNeedsConstructing', function(textbox) {
				var element = constructTextbox(textbox.text, false);
				app.game.addTextbox(element, textbox.text, textbox.x, textbox.y, true);
			});
			app.game.addEvent('actionNeedsConstructing', function(textbox) {
				var element = constructTextbox(textbox.text, true);
				app.game.addAction(element, textbox.text, textbox.x, textbox.y, true);
			});

			// show the toolbar
			var prevImgBtn = null;
			var toolbarContent = new Element('div', { id: 'toolbarContent' });

			toolbarBtns['deleteBtn'] = new Element('input', {
				type: 'image',
				'class': 'toolbarbtn',
				src: '../images/tools/delete.png',
				events: {
					click: function() {
                        if (isCreator) {
                        	this.addClass('selectedBtn');
							if (prevImgBtn && prevImgBtn != this) prevImgBtn.removeClass('selectedBtn');
							prevImgBtn = this;
                            app.setActionMode(App.ActionMode.DELETE);
                        } else {
						    showNotice('info', 'This feature has not been implemented yet'); //TODO
                        }
					}
				}
			});
			new mBox.Tooltip({
				content: 'Delete '+(isCreator ? 'an object or textbox (textbox deletion not implemented yet)' : 'textbox or action'),
				theme: 'Black',
				attach: toolbarBtns['deleteBtn']
			});
			toolbarBtns['deleteBtn'].inject(toolbarContent);

			toolbarBtns['moveBtn'] = new Element('input', {
				type: 'image',
				'class': 'toolbarbtn',
				src: '../images/tools/move.png',
				events: {
					click: function() {
						//this.addClass('selectedBtn');
						//if (prevImgBtn && prevImgBtn != this) prevImgBtn.removeClass('selectedBtn');
						//prevImgBtn = this;
						showNotice('info', 'This feature has not been implemented yet'); //TODO
					}
				}
			});
			new mBox.Tooltip({
				content: 'Move '+(isCreator ? 'an object or textbox' : 'textbox or action'),
				theme: 'Black',
				attach: toolbarBtns['moveBtn']
			});
			toolbarBtns['moveBtn'].inject(toolbarContent);


			var textboxPrompt = new mBox.Modal({
				content: '<div style="width:213px;"><textarea style="width:200px; margin-top:5px" cols="30" rows="3" id="textboxContent"></textarea></div>',
				title: 'Enter your text',
				closeOnBodyClick: false,
				position: { x: ['left', 'inside'], y: ['top', 'inside'] },
				fade: false,
				onOpen: function() {
					// position at the cursor
					this.setPosition(canvas, this.options.position, { x: this['textboxPos'].x, y: this['textboxPos'].y });
					setTimeout(function() { document.id('textboxContent').focus(); }, 10); // focus the textarea
				},
				buttons: [
					{title: 'Cancel'},
					{
						title: 'Add',
						addClass: 'button_green',
						event: function() {
							var text = document.id('textboxContent').get('value');
							document.id('textboxContent').set('value', '');
							var textNode = constructTextbox(text, this['isAction']);
							if (this['isAction']) {
								app.game.addAction(textNode, text, this['textboxPos'].x, this['textboxPos'].y);
							} else {
								app.game.addTextbox(textNode, text, this['textboxPos'].x, this['textboxPos'].y);
							}
							this.close();
						}
					}
				]
			});
			toolbarBtns['textboxBtn'] = new Element('input', {
				type: 'image',
				'class': 'toolbarbtn',
                id: 'textboxButton',
				src: '../images/tools/textbox.png',
				events: {
					click: function() {
						this.addClass('selectedBtn');
						if (prevImgBtn && prevImgBtn != this) prevImgBtn.removeClass('selectedBtn');
						prevImgBtn = this;
						app.setActionMode(App.ActionMode.TEXT);
						app.addEvent('textboxCreateRequest', function(pos) {
							if (!isCreator && app.game.numTextboxesByMe > 0) {
								// this is a player attempting to place a second textbox
								// TODO move the current textbox to the new location or disable the button
								showNotice('info', 'The player can only have one textbox per turn');
							} else {
								textboxPrompt['textboxPos'] = pos;
								textboxPrompt['isAction'] = false;
								textboxPrompt.open();
							}
						});
					}
				}
			});
			new mBox.Tooltip({
				content: 'Insert a textbox',
				theme: 'Black',
				attach: toolbarBtns['textboxBtn']
			});
			toolbarBtns['textboxBtn'].inject(toolbarContent);

			if (!isCreator) {
				toolbarBtns['actionBtn'] = new Element('input', {
					type: 'image',
					'class': 'toolbarbtn',
                    id: 'actionButton',
					src: '../images/tools/action.png',
					events: {
						click: function() {
							this.addClass('selectedBtn');
							if (prevImgBtn && prevImgBtn != this) prevImgBtn.removeClass('selectedBtn');
							prevImgBtn = this;
							app.setActionMode(App.ActionMode.ACTION);
							app.addEvent('actionCreateRequest', function(pos) {
								if (app.game.actionBox != null) {
									// this is a player attempting to place a second action
									// TODO move the current action to the new location or diable the button
									showNotice('info', 'The player can only have one action per turn');
								} else {
									textboxPrompt['textboxPos'] = pos;
									textboxPrompt['isAction'] = true;
									textboxPrompt.open();
								}
							});
						}
					}
				});
				new mBox.Tooltip({
					content: 'Insert an action',
					theme: 'Black',
					attach: toolbarBtns['actionBtn']
				});
				toolbarBtns['actionBtn'].inject(toolbarContent);

				// initially use the action button for the Player
				toolbarBtns['actionBtn'].fireEvent('click');
			}

			toolbarBox = new mBox({
				title: 'Toolbar',
				content: toolbarContent,
				width: 100,
				height: 200,
				draggable: true,
				target: 'main',
				addClass: { 'title': 'paneltitle' },
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

			if (isCreator) {
				// creator-only toolbar buttons
				toolbarBtns['editBtn'] = new Element('input', {
					type: 'image',
					'class': 'toolbarbtn',
					src: '../images/tools/edit.png',
					events: {
						click: function() {
							//this.addClass('selectedBtn');
							//if (prevImgBtn && prevImgBtn != this) prevImgBtn.removeClass('selectedBtn');
							//prevImgBtn = this;
							showNotice('info', 'This feature has not been implemented yet'); //TODO
						}
					}
				});
				new mBox.Tooltip({
					content: 'Edit an object',
					theme: 'Black',
					attach: toolbarBtns['editBtn']
				});
				toolbarBtns['editBtn'].inject(toolbarContent);

				toolbarBtns['clearBtn'] = new Element('input', {
					type: 'image',
					'class': 'toolbarbtn',
					src: '../images/tools/clear.png',
					events: {
						click: function() {
							if (app.game.active) confirmClearDialog.open();
						}
					}
				});
                var confirmClearDialog = new mBox.Modal({
		            title: 'Are you sure?',
		            content: '<p>Clearing the screen deletes all tiles and objects that have been placed.</p><p>Are you sure you want to do this?</p>',
		            target: 'gamecanvas',
		            buttons: [{
			            title: 'Clear',
			            addClass: 'button_green',
			            event: function() {
			            	app.game.clearScreen(true);
				            this.close();
			            }
		            }, {
                        title: "Cancel",
                        event: function() {
                            this.close();
                        }
                    }]
                });
				new mBox.Tooltip({
					content: 'Clear the world',
					theme: 'Black',
					attach: toolbarBtns['clearBtn']
				});
				toolbarBtns['clearBtn'].inject(toolbarContent);

				// show the tile and object selector
				// TODO? would be *super* cool to use this for our selector: http://mcpants.github.io/jquery.shapeshift/
				var selectorTabs = new Element('div', { id: 'selectorTabs' });
				var tabsList = new Element('ul', { 'class': 'tabs' });
				tabsList.grab(new Element('li', { text: 'Tiles' }));
				tabsList.grab(new Element('li', { text: 'Objects' }));
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
				for (var i = 0; i < globals.objectIds.length; i++) {
					var id = globals.objectIds[i];
					var type = app.game.getObjectTypeInstance(id);
					var objectBtn = type.image;
					objectBtn.addClass('imgBtn');
					objectBtn.addClass('object');
					objectBtn.addEvent('click', function() {
						this.addClass('selectedBtn');
						if (prevImgBtn && prevImgBtn != this) prevImgBtn.removeClass('selectedBtn');
						prevImgBtn = this;
						// update the app state
						app.setActionMode(App.ActionMode.PLACE, this['objectType']);
					});
					objectBtn['objectType'] = type, //TODO this is hacky
					objectBtn.inject('objectSelect');
					toolbarBtns[('object_'+id)] = objectBtn;
					new mBox.Tooltip({
						content: ('Object "'+id+'"'),
						theme: 'Black',
						attach: objectBtn
					});
				}
				// buttons for tiles
				for (var i = 0; i < globals.tileIds.length; i++) {
					var id = globals.tileIds[i];
					var type = app.game.getTileTypeInstance(id);
					var tileBtn = type.image;
					tileBtn.addClass('imgBtn');
					tileBtn.addClass('tile');
					tileBtn.addEvent('click', function() {
						this.addClass('selectedBtn');
						if (prevImgBtn && prevImgBtn != this) prevImgBtn.removeClass('selectedBtn');
						prevImgBtn = this;
						// update the app state
						app.setActionMode(App.ActionMode.PLACE, this['tileType']);
					});
					tileBtn['tileType'] = type, //TODO this is hacky
					tileBtn.inject('tileSelect');
					toolbarBtns[('tile_'+id)] = tileBtn;
					new mBox.Tooltip({
						content: ('Tile "'+id+'"'),
						theme: 'Black',
						attach: tileBtn
					});
					if (i == 0) tileBtn.fireEvent('click'); // initially use the first tile for the Creator
				}
			}

			// show the 'end turn button'
			endBtn = new Element('button', {
				text: 'End turn',
				'class': 'btn red',
				disabled: 'disabled',
				events: { click: app.endTurn },
				id: 'endturn'
			});
			endBtn.inject('bottom');

			var tutorialBtn = new Element('button', {
				text: 'Tutorial',
				'class': 'btn lime',
				events: {
					click: (isCreator ? startCreatorIntro : startPlayerIntro)
				},
				id: 'tutorialBtn'
			});
			tutorialBtn.inject('bottom');

			activateToolbar(false); // initially disable the toolbar

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
