/**
 * Perform all DOM manipulation in this top level function (by listening to events from app or app.game).
 * @see  <a href="http://mootools.net/docs/core/Element/Element">MooTools Element class</a> for DOM tools.
 */
function loaded() {
	var canvas = document.id('gamecanvas');
	var playerBtn = document.id('playerBtn');
	var creatorBtn = document.id('creatorBtn');
	playerBtn.disabled = false;
	creatorBtn.disabled = false;

	playerBtn.addEvent('click', function(){
		begin(false);
	});
	creatorBtn.addEvent('click', function(){
		begin(true);
	});

	function begin(isCreator) {
		// disable the buttons first
		playerBtn.disabled = true;
		creatorBtn.disabled = true;
		// TODO show a waiting animation

		// start the app
		var app = new App(canvas, isCreator);
		app.connect();

		// setup callbacks for our custom events
		// NOTE it is the event listener's responsibility (not the event generator's) to remove any listeners it registers
		var onJoinFailed = function(cause) {
			// remove all event listeners since we are going to discard app instance anyway
			app.removeEvents();
			app = null;
			// re-enable the buttons
			playerBtn.disabled = false;
			creatorBtn.disabled = false;
			// TODO stop waiting animation
			// display the failure message
			alert(cause.msg);
		};
		var onGameStarted = function(game) {
			// remove our event listener for joinFailed
			app.removeEvent('joinFailed', onJoinFailed);
			// completely remove the buttons
			playerBtn.dispose();
			creatorBtn.dispose();
			// TODO stop and remove waiting animation
			alert('Game started. You are the ' + (game.isCreator ? 'creator' : 'player') + '.');
		};
		app.addEvent('joinFailed', onJoinFailed);
		app.addEvent('gameStarted', onGameStarted);

		// ok to attempt to join the server
		app.join();
	}
}
window.addEvent('domready', loaded); // call when everything has loaded