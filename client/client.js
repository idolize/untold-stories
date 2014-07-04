var $ = require('jquery');
var jBox = require('jBox');
var ActionMode = require('./model/ActionModeEnum');
var UntoldStories = require('./model/UntoldStories');
var TextboxPrompt = require('./view/TextboxPrompt');
var ToolbarPanel = require('./view/ToolbarPanel');
var SelectorPanel = require('./view/SelectorPanel');
var Tutorial = require('./view/Tutorial');


$(loaded);

function loaded() {
  console.log('loaded');
  var canvas = $('#gamecanvas');
  var myStatus = $('#mystatus');
  var otherPlayerStatus = $('#otherstatus');
  var topRight = {
    y: 'top',
    x: 'right'
  };

  // create waiting popup and animation
  var waitingTextArea = $('<div></div>');
  $('<p />', {
    text: 'Waiting for other player...'
  }).appendTo(waitingTextArea);

  // TODO replace with jQuery element
  var waitingAnim = new MUX.Loader.Bar();
  $(waitingAnim.elem).appendTo(waitingTextArea);
  var waitingPopup = new mBox({
    content: waitingTextArea[0],
    overlay: true,
    closeOnEsc: false,
    closeOnBodyClick: false,
    closeOnMouseleave: false
  });
  // create join game dialog
  var joinModal = new mBox.Modal({
    title: 'Join a game',
    content: 'joinprompt',
    target: 'gamecanvas',
    buttons: [{
      title: 'Start',
      id: 'startBtn',
      event: function() {
        // validate everything first
        // TODO add some server-side validation here too
        if (!form.validateElement(document.id('username'))) {
          showNotice('notice', 'You must enter a valid username');
          return;
        }
        if (!form.validateElement(document.id('otherusername'))) {
          showNotice('notice', 'Other player\'s username is invalid');
          return;
        }
        this.close(); // close modal
        var isCreator = document.id('joinform').getElement('input[name=playertype]:checked').get('value') === 'creator';
        var username = document.id('username').get('value');
        var otherPlayerUsername = document.id('otherusername').get('value');
        if (otherPlayerUsername === '') otherPlayerUsername = undefined;
        beginGame(isCreator, username, otherPlayerUsername); // start game
      }
    }],
    attach: 'play' // attach this dialog to the play button's onClick handler
  });

  // create any tooltips in the HTML
  new mBox.Tooltip({
    setContent: 'data-tooltip',
    theme: 'Black',
    width: 200,
    attach: $$('*[data-tooltip]')
  });

  $('#play').prop('disabled', false);
  
  // create the app
  var app = new UntoldStories(canvas[0]);



  /**
   * Sets everything in motion for the entire application and game.
   * @param {Boolean} isCreator If the player wishes to be a Creator or not.
   * @param {String} username The player's desired username.
   * @param {String} [otherPlayerUsername] The (optional) username of another player to play with if starting a private game.
   */
  function beginGame(isCreator, username, otherPlayerUsername) {
    // show waiting animation
    showWaiting(true);

    var endBtn, creatorHelpBtn, playerHelpBtn, notifyBtn; // relevant DOM
    var toolbar, selector; // panels

    function activatePanels(active) {
      toolbar.setEnabled(active);
      if (isCreator) selector.setEnabled(active);
    }

    function showTabNotification(show){
      if(show){
        document.title = "It's your turn! :: Untold Stories";
      } else{
        document.title = "Untold Stories";
      }
    }

    // setup callbacks for our custom events
    function onTurnStarted() {
      endBtn.prop('disabled', false);
      activatePanels(true);
      canvas.parent().addClass('active');
      if (app.actionMode === ActionMode.MOVE) canvas.parent().addClass('moving');
      if (isCreator) app.game.showGrid(true);
      showNotice('info', 'Your turn has started');
      changeDisplayStatus(true);
      showTabNotification(true);
    }

    function onTurnEnded() {
      endBtn.prop('disabled', true);
      activatePanels(false);
      canvas.parent().removeClass('active');
      canvas.parent().removeClass('moving');
      if (isCreator) app.game.showGrid(false);
      changeDisplayStatus(false);
      showTabNotification(false);
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
      app.removeListener('joinFailed', onJoinFailed);
      // stop waiting animation
      showWaiting(false);
      // remove the play button
      $('#play').remove();

      if (!isCreator) showNotice('info', 'Game started. The Creator ('+ game.otherPlayerUsername +') is now taking their turn.');
      $('#myname').text(username);
      $('#othername').text(game.otherPlayerUsername);
      $('#mytype').text(isCreator ? 'Creator' : 'Player');
      $('#othertype').text(isCreator ? 'Player' : 'Creator');
      changeDisplayStatus(false);

      // handle all requests to create textboxes and actions
      var constructTextbox = function(text, isAction) {
        var element = $('<p />', {
          'class': 'textbox' + (isAction? ' action' : ''),
          style: { display: 'none' },
          text: text
        });
        element.appendTo('textcontainer');
        return element;
      };
      game.on('constructTextboxFromOtherClient', function(textbox) {
        var element = constructTextbox(textbox.text, false);
        game.addTextbox(element, textbox.text, textbox.x, textbox.y, !isCreator, true);
      });
      game.on('constructActionFromOtherClient', function(textbox) {
        var element = constructTextbox(textbox.text, true);
        game.placeAction(element, textbox.text, textbox.x, textbox.y, true);
      });
      var textboxPrompt = new TextboxPrompt(canvas);
      app.on('textboxCreateRequest', function(pos) {
        if (!isCreator && game.playerTextbox != null) {
          // this is a player attempting to place a second textbox
          // TODO move the current textbox to the new location or disable the button
          showNotice('info', 'The player can only have one textbox per turn');
        } else {
          textboxPrompt.openPrompt(pos, false, function(text) {
            var textNode = constructTextbox(text, false);
            game.addTextbox(textNode, text, pos.x, pos.y, isCreator);
          });
        }
      });
      app.on('actionCreateRequest', function(pos) {
        if (!isCreator && game.actionBox != null) {
          // this is a player attempting to place a second textbox
          // TODO move the current textbox to the new location or disable the button
          showNotice('info', 'The player can only have one action per turn');
        } else {
          textboxPrompt.openPrompt(pos, true, function(text) {
            var textNode = constructTextbox(text, true);
            game.placeAction(textNode, text, pos.x, pos.y);
          });
        }
      });


      // show the toolbar
      toolbar = new ToolbarPanel(isCreator);
      toolbar.on('deleteClicked', function() {
        if (isCreator) {
          app.setActionMode(ActionMode.DELETE);
        } else {
          showNotice('info', 'This feature has not been implemented yet'); //TODO
        }
      });
      toolbar.on('moveClicked', function() {
        if (isCreator) {
          app.setActionMode(ActionMode.MOVE);
        } else {
          showNotice('info', 'This feature has not been implemented yet'); //TODO
        }
      });

      toolbar.on('textboxClicked', function() {
        app.setActionMode(ActionMode.TEXT);
      });
      if (isCreator) {
        // edit button clicked
        toolbar.on('editClicked', function() {
          showNotice('info', 'This feature has not been implemented yet'); //TODO
        });
        // clear button clicked and confirmed
        toolbar.on('clearClicked', function() {
          game.clearScreen();
        });
      } else {
        // insert action button clicked
        toolbar.on('actionClicked', function() {
          app.setActionMode(ActionMode.ACTION);
        });
      }
      toolbar.show();


      // show the selector
      if (isCreator) {
        // retrieve all available tile and object types
        var tileTypes = globals.tileIds.map(function(id){ return game.getTileTypeInstance(id); });
        var objectTypes = globals.objectIds.map(function(id){ return game.getObjectTypeInstance(id); });

        // create the selector
        selector = new SelectorPanel(tileTypes, objectTypes);
        var imgBtnClicked = function(imgBtn) {
          app.setActionMode(ActionMode.PLACE, imgBtn.type);
        };
        selector.on('tileBtnClicked', imgBtnClicked);
        selector.on('objBtnClicked', imgBtnClicked);
        selector.show();

        // if the selection changes in one panel make sure it clears any selection in the other
        selector.on('selectionChanged', function(newBtn) {
          canvas.parent().removeClass('moving');
          toolbar.clearSelectedBtn();
        });
        toolbar.on('selectionChanged', function(newBtn) {
          if (newBtn.toolname === 'move') canvas.parent().addClass('moving');
          else canvas.parent().removeClass('moving');
          selector.clearSelectedBtn();
        });
      }

      // select the initial tool for each player
      toolbar.clickBtn('textbox');

      // show the 'end turn button'
      endBtn = $('<button />', {
        text: 'End turn',
        'class': 'btn red',
        disabled: 'disabled',
        on: { click: app.endTurn.bind(app) },
        id: 'endturn'
      });
      endBtn.appendTo('#bottom');

      // show the 'desktop notification button'
      notifyBtn = $('<button />', {
        text: 'Notify',
        'class': 'btn',
        on: {
          click: function notify() {
            var havePermission = window.webkitNotifications.checkPermission();
            if (havePermission == 0) {
              // 0 is PERMISSION_ALLOWED
              var notification = window.webkitNotifications.createNotification(
                    'http://i.stack.imgur.com/dmHl0.png',
                    'Chrome notification!',
                    'Here is the notification text');

              notification.onclick = function () {
                window.open("http://stackoverflow.com/a/13328397/1269037");
                notification.close();
              }
              notification.show();
            } else {
              window.webkitNotifications.requestPermission();
            }
          },
        },
        id: 'notify'
      });
      notifyBtn.appendTo('#bottom');

      var tutorial = new Tutorial(isCreator);

      var tutorialBtn = $('<button />', {
        text: 'Tutorial',
        'class': 'btn lime',
        on: {
          click: tutorial.start.bind(tutorial)
        },
        id: 'tutorialBtn'
      });
      tutorialBtn.appendTo('#bottom');

      activatePanels(false); // initially disable everything until a turn starts

      // now listen for turn events
      app.on('turnStarted', onTurnStarted);
      app.on('turnEnded', onTurnEnded);
      app.on('otherPlayerDisconnected', onOtherPlayerDisconnected);
    }

    app.on('connected', function() {
      // listen for response to join request
      app.on('joinFailed', onJoinFailed);
      app.on('gameStarted', onGameStarted);
      // ok to begin attempt to join the server
      if (otherPlayerUsername) {
        // private game
        app.playWithOtherPlayer(isCreator, username, otherPlayerUsername);
      } else {
        // matchamking
        app.playMatchmaking(isCreator, username);
      }
    });
    app.on('connectFailed', onConnectFailed);
    app.on('disconnected', onDisconnected);

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
    // TODO convert to jBox
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
    canvas.parent().addClass('done');
  }

  /**
   * Changes the status text for both players in the game.
   * @param {Boolean} active If it is the current player's turn or not.
   */
  function changeDisplayStatus(active) {
    myStatus.css('display', 'inline');
    otherPlayerStatus.css('display', 'inline');
    if (active) {
      myStatus.text('Active');
      otherPlayerStatus.text('Waiting');
    } else {
      myStatus.text('Waiting');
      otherPlayerStatus.text('Active');
    }
  }

  if (globals.autojoin) {
    var isCreator = globals.autojoin == 'creator';
    beginGame(isCreator, globals.autojoin.toUpperCase()); // just use 'PLAYER' or 'CREATOR' as username and start matchamking
  }
}