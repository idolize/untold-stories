function startCreatorIntro() {
	var intro = introJs();
	intro.setOptions({
		steps: [
			{
				element: document.getElementById('logo'),
				intro: 'Welcome to Tabula Rasa! In this game you will be creating a story for another person to play through. (Click next or use the arrow keys to proceed)'
			},
			{
				element: document.getElementById('infobar'),
				intro: 'This bar always shows what your role is and your current status.',
				position: 'bottom'
			},
			{
				element: document.getElementById('gamecanvas'),
				intro: 'This is the game world you will be creating.',
				position: 'bottom'
			},
			{
				element: document.getElementById('middle'),
				intro: 'Here you can type a single message describing any dialog that takes place in your scene.',
				position: 'top'
			},
			{
				element: document.getElementById('toolbarBox'),
				intro: 'This is a panel- you can drag these around. This panel is used for selecting your current tool.',
        position: 'right'
			},
      {
        element: document.getElementById('selectorTabs'),
        intro: 'This panel lets you pick what tile or object you want to place.\nJust click to select the tile or object and then click to place one in the world (or click and drag to place several at once).',
        position: 'left'
      }
		]
	});
	intro.start();
}

function startPlayerIntro() {
	var intro = introJs();
	intro.setOptions({
		steps: [
			{
				element: document.getElementById('logo'),
				intro: 'Welcome to Tabula Rasa! In this game you will be playing through a story created by another person. (Click next or use the arrow keys to proceed)'
			},
			{
				element: document.getElementById('infobar'),
				intro: 'This bar always shows what your role is and your current status.',
				position: 'bottom'
			},
      {
        element: document.getElementById('gamecanvas'),
        intro: 'This is the game world scene you will be playing in. Use the arrow keys to move the hero around the scene.',
        position: 'bottom'
      },
			{
				element: document.getElementById('middle'),
				intro: 'Here you can type a single message describing what you want to "do" for your turn. This can be anything at all (for example: "cut down tree" or "open door").',
				position: 'top'
			}
		]
	});
	intro.start();
}