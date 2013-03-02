Tabula Rasa :: README
====================

Description
---------------------

Tell your own story any way you want in a game where absolutely anything goes. ***TabulaRasa***: a multiplayer storytelling game.

Installation
---------------------

After checking out the code (and installing Node.js and npm) run the following command: `$ npm install -l`

This will install all of the dependencies for the application based on the package.json file.

Next, simply run: `$ node server.js`

And then open your web browser to [the localhost page](http://localhost:8888).

### Dependecies with npm
If the dependencies of the project change you can fix your local install by running `npm prune -l` and then reinstalling all of the dependencies or just the new ones.

### Debugging client
It is recommended for debugging that you use [Firebug](http://getfirebug.com/) (although the Chrome development console will work almost as well).


Directories
---------------------

The resources/ directory is used for any static files (files served to the client as-is). The client can reference these files without including the "resources" part of the URI (so /resources/js/client.js can be referenced as just js/client.js on the client).


Style Guidelines
--------------------

### OOP
Try to avoid using the global namespace as much as possible. Instead, use [MooTools classes](http://mootools.net/docs/core/Class/Class) to encapsulate your objects like you would in a language like Java or C++. [Server-side class definitions](https://npmjs.org/package/mootools) are also available.

### Comments
Classes and functions can/should be documented using the [JSDoc syntax](http://en.wikipedia.org/wiki/JSDoc). If you are using Sublime Text 2 then install the [DockBlockr plugin](https://tutsplus.com/lesson/docblockr/) to automatically generate these comments for you.