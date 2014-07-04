var intro = require('intro.js');

function Tutorial(isCreator) {
  this.intro = intro.introJs();
  var steps = (isCreator ? getStepsForCreator() : getStepsForPlayer());
  this.intro.setOptions({steps: steps});
}
module.exports = Tutorial;

function getStepsForCreator() {
  return [
  {
    intro: 'Welcome to Untold Stories! In this game you will be creating a story for another person to play through. (Click next or use the arrow keys to proceed)'
  },
  {
    element: '#infobar',
    intro: 'This bar always shows what your role is and your current status.',
    position: 'bottom'
  },
  {
    element: '#gamecanvas',
    intro: 'This is the game world you will be creating.',
    position: 'bottom'
  },
  {
    element: '#toolbarBox',
    intro: 'This is a panel- you can drag these around. This panel is used for selecting your current tool.',
    position: 'right'
  },
  {
    element: '#selectorTabs',
    intro: 'This panel lets you pick what tile or object you want to place.\nJust click to select the tile or object and then click to place one in the world (or click and drag to place several at once).',
    position: 'left'
  }
  ];
}

function getStepsForPlayer() {
  return [
  {
    intro: 'Welcome to Untold Stories! In this game you will be playing through a story created by another person. (Click next or use the arrow keys to proceed)'
  },
  {
    element: '#infobar',
    intro: 'This bar always shows what your role is and your current status.',
    position: 'bottom'
  },
  {
    element: '#gamecanvas',
    intro: 'This is the game world scene you will be playing in. Use the arrow keys to move the hero around the scene.',
    position: 'bottom'
  },
  {
    element: '#textboxToolBtn',
    intro: 'Use this button to insert dialog.  You can only insert one dialog box per turn so use it wisely.',
    position: 'bottom'
  },
  {
    element: '#actionToolBtn',
    intro: 'Use this button to insert an action.  An action is a text box that describes what your character is doing.  You can only place one action per turn, so use it wisely.',
    position: 'bottom'
  },
  ]
}

Tutorial.prototype.start = function() {
  console.log('this', this);
  this.intro.start();
};