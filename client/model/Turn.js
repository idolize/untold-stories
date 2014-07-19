
function Turn(isCreator, turnNumber, commands) {
  this.isCreator = isCreator;
  this.turnNumber = turnNumber;

  if (commands) {
    this.commands = commands;
  } else {
    this.commands = [];
  }

  this.redoStack = [];
}

Turn.prototype.addAndExecute = function(action) {
  this.commands.push(action);
  this.redoStack.length = 0;
  action.execute();
};

Turn.prototype.undo = function(numLevels) {
  numLevels = numLevels || 1;
  var undoStack = this.commands;
  for (var i = 0; i < numLevels; i++) {
    if (undoStack.length > 0) {
      var command = undoStack.pop();
      command.unExecute();
      this.redoStack.push(command);
    }
  }
};

Turn.prototype.redo = function(numLevels) {
  numLevels = numLevels || 1;
  for (var i = 0; i < numLevels; i++) {
    if (this.redoStack.length > 0) {
      var command = this.redoStack.pop();
      command.execute();
      this.commands.push(command);
    }
  }
};

Turn.prototype.reset = function() {
  this.commands.length = this.redoStack.length = 0;
};

Turn.prototype.toJSON = function() {
  var commands = this.commands.slice(0); // clone the array
  for (var i = commands.length - 1; i >= 0; i--) {
    var lastAction = commands[i];
    if (lastAction.onlyUseLast) {
      // purge old commands of this type
      for (var j = i - 1; j >= 0; j--) {
        if (lastAction.constructor === commands[j].constructor) {
          commands.splice(j, 1);
          i--;
        }
      }
    }
  }
  return { isCreator: this.isCreator, turnNumber: this.turnNumber, commands: commands };
};

Turn.fromJSON = function(jsonObj, commandTypes) {
  for (var i = 0; i < jsonObj.commands.length; i++) {
    var jsonAction = jsonObj.commands[i];
    jsonObj.commands[i] = commandTypes[jsonAction.type].fromJSON(jsonAction);
  }
  return new Turn(jsonObj.isCreator, jsonObj.turnNumber, jsonObj.commands);
};

module.exports = Turn;