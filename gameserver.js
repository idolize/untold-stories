(function() {
    'use strict';

	require('mootools');
	var async = require('async');

	/**
	 * Represents an individual room inside the game server.
	 * Does not 'know' about the actual sockets -- could be any object really.
	 * @type {Class}
	 */
	var GameRoom = new Class({
		Implements: [process.EventEmitter], //node.js event framework- faster than MooTools Events on server

		roomName: null,
		player: null,
		creator: null,
		inProgress: null,
		numTurns: null,

		initialize: function(roomName) {
			this.roomName = roomName;
			this.reset();
		},
		reset: function() {
			this.player = this.creator = null;
			this.inProgress = false;
			this.numTurns = 0;
		},
		attemptJoin: function(socket, username, isCreator) {
			var playerType, otherPlayerType;
			if (isCreator) {
				playerType = 'creator';
				otherPlayerType = 'player';
			} else {
				playerType = 'player';
				otherPlayerType = 'creator';
			}
			if (!this[playerType]) {
				// set reference
				this[playerType] = socket;
				socket['isCreator'] = isCreator;
				socket['username'] = username;
				async.nextTick(function() {
					if (this[otherPlayerType]) {
						// both sides have joined
						this.inProgress = true;
						this.emit('started');
					}
				}.bind(this));
				return true;
			} else {
				return false;
			}
		},
		leave: function(socket, isCreator) {
			var playerType = isCreator ? 'creator' : 'player';
			// slot is now free and game is not in progress
			this[playerType] = null;
			this.inProgress = false;
			async.nextTick(function() {
				this.emit('ended');
			}.bind(this));
		}
	});


	exports.gameRooms = {};		// all rooms
	exports.publicRooms = {};	// just public rooms

	/**
	 * Used for matchmaking. Joins an existing room if one with the required characteristics exists, and if not
	 * then a new room is created.
	 * @param  {Socket}  socket    Socket.io socket of player looking for room.
	 * @param  {String}  username  The username of the player looking for a room.
	 * @param  {Boolean} isCreator If the player is a Creator or not.
	 */
	exports.findOpenRoom = function(socket, username, isCreator) {
		// check if an existing open room exists waiting on a player of our type and join that
		var existingRoom = null;
		for (var gameRoomName in exports.publicRooms) {
			var gameRoom = exports.publicRooms[gameRoomName];
			// join first room that satisfies our criteria
			var otherPlayerType = isCreator ? 'player' : 'creator';
			if (gameRoom[otherPlayerType]) { // make sure we join a game created by someone of the opposite type
				var newRoomName = exports.getRoomNameFromUsernames(username, gameRoom[otherPlayerType]['username']);
				if (!exports.gameRooms[newRoomName]) { // make sure we are not already playing a game with this person
					delete exports.publicRooms[gameRoom.roomName]; // de-list the room
					delete exports.gameRooms[gameRoom.roomName];
					// remap the room with its new name
					gameRoom.roomName = newRoomName;
					exports.gameRooms[gameRoom.roomName] = gameRoom;
					// this is now a "private" unlisted game
					existingRoom = gameRoom;
					break;
				}
			}
		}
		// if no other rooms exist, create a new one
		if (!existingRoom) {
			existingRoom = new GameRoom('_public-'+username); // arbitrary, temporary room name
			exports.publicRooms[existingRoom.roomName] = existingRoom;
		}

		// now join the room
		joinKnownRoom(existingRoom, socket, username, isCreator);
	};

	/**
	 * Joins an existing private game or creates the game if it doesn't exist yet.
	 * @param  {Socket}  socket              The socket.io socket of the player attempting to join.
	 * @param  {String}  username            The username of the player attempting to join.
	 * @param  {Boolean} isCreator           If the player is attempting to join as a Creator or not.
	 * @param  {String}  otherPlayerUsername Username of the other player in the game.
	 */
	exports.joinRoom = function(socket, username, isCreator, otherPlayerUsername) {
		var roomName = exports.getRoomNameFromUsernames(username, otherPlayerUsername);
		var gameRoom = exports.gameRooms[roomName];
		if (!gameRoom) {
			// create the room if it doesn't exist already
			gameRoom = new GameRoom(roomName);
			exports.gameRooms[roomName] = gameRoom;
		}
		joinKnownRoom(gameRoom, socket, username, isCreator);
	};

	/**
	 * Method used to determine the room name from two players (order does not matter).
	 * @param  {String} username1 One of the usernames.
	 * @param  {String} username2 The other username.
	 */
	exports.getRoomNameFromUsernames = function(username1, username2) {
		// sort the usernames alphabetically to ensure consistency
		var one, two;
		if (username1 < username2) {
			one = username1;
			two = username2;
		} else {
			one = username2;
			two = username1;
		}
		return one+'&'+two; // room name is just the two player's names together
	};


	// local function
	function joinKnownRoom(gameRoom, socket, username, isCreator) {
		// try to join the room
		var success = gameRoom.attemptJoin(socket, username, isCreator);

		if (success) { // lobby joined but game not started yet
			var otherSocket = null;
			// register to the 'ready' event of gameServer
			var onGameStarted = function() {
				otherSocket = isCreator ? gameRoom.player : gameRoom.creator;
				socket.emit('ready', otherSocket['username']);
				// now the game is in progress so we listen for turn events
				socket.on('turnEnded', function(changes) {
					// store the number of turns and other game stats here
					gameRoom.numTurns++;
					// notify the other player that the turn has ended
					otherSocket.emit('yourTurn', changes);
				});
			};
			gameRoom.once('started', onGameStarted); // still need one more player
			// register for disconnected event of this client's socket
			socket.on('disconnect', function() {
				// if game is in progress send an error to the other player
				if (gameRoom.inProgress) otherSocket.emit('otherPlayerDisconnected');
				gameRoom.removeListener('started', onGameStarted);
				gameRoom.leave(socket, isCreator);
				// TODO allow rejoining of games where only one player leaves mid-game
				delete exports.gameRooms[gameRoom.roomName];
				delete exports.publicRooms[gameRoom.roomName];
			});
		}
		else {
			socket.emit('joinFailed', {msg: ('There is already a ' + (isCreator ? 'creator' : 'player') + ' in the game.')});
		}
	}
}());