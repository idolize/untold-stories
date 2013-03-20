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
		// TODO show a loading animation

		// start the app
		var app = new App(canvas, isCreator);
		app.connect();

		// setup callbacks for our custom events
		app.addEvent('joinFailed', function(cause) {
			// remove any event listeners already attached to the app
			app.removeEvents();
			// re-enable the buttons
			playerBtn.disabled = false;
			creatorBtn.disabled = false;
			// TODO stop loading animation
			// display the failure message
			alert(cause.msg);
		});
		app.addEvent('gameStarted', function(game) {
			// no longer need to listen for joinFailed events
			app.removeEvents('joinFailed');
			// completely remove the buttons
			playerBtn.dispose();
			creatorBtn.dispose();
			// TODO remove loading animation
			// now do something interesting
			alert('Game started');
		});

		// ok to attempt to join the server
		app.join();
	}
}
window.addEvent('domready', loaded); // call when everything has loaded