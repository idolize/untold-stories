Tabula Rasa :: README
====================

Description
---------------------

Tell your own story any way you want in a game where absolutely anything goes. ***TabulaRasa***: a multiplayer storytelling game.

Deployment
---------------------

A version of the application is deployed on RedHat OpenShift at the following URL: [http://tabula-rasa.rhcloud.com](http://tabula-rasa.rhcloud.com/)

The application has different settings for a production environment than a development environment: for example the listening port may be different or the level of debug statements may be different. Rather than hardcode the environment in the application code (which would require maintaing multiple versions of the code), the environment variable `$NODE_ENV` is set to "production" or "development" accordingly (if it is not set then it defaults to development). This is a standard practice among NodeJS applications.

Note: OpenShift support for Websockets is still in preview mode. As such, it [requires that all websocket connections be created on port 8000](https://www.openshift.com/blogs/paas-websockets) rather than the normal web port.

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

### Events
Use the [event (aka observer) pattern](http://en.wikipedia.org/wiki/Observer_pattern) to avoid having to pass around a bunch of objects or break encapsulation. MooTools provides [a simple API to fire and listen for events](http://mootools.net/docs/core/Class/Class.Extras#Events) on the client side; for the server-side it is recommended to use the [native Node.js EventEmitter API](http://nodejs.org/api/events.html) instead. Note: server-side MooTools provides a way to implement the EventEmitter API in your server-side classes - [see the "Usage" section of the npm page](https://npmjs.org/package/mootools).

Remember: it is almost always the event listener's responsibility (not the event generator's) to remove any listeners it registers.

### Comments
Classes and functions can/should be documented using the [JSDoc syntax](http://en.wikipedia.org/wiki/JSDoc). If you are using Sublime Text 2 then install the [DockBlockr plugin](https://tutsplus.com/lesson/docblockr/) to automatically generate these comments for you.


Tilesets and Images
--------------------

Tiles are 32 x 32 pixels in size, saved as PNG-32 images with transparency. A collection of free 16x16 tileset images [can be found on opengameart.org](http://opengameart.org/content/oga-16x16-jrpg-sprites-tiles): to use these images save the original, resize it to 200% (without using any antialiasing), convert all white pixels to transparent pixels, and then export the image as a PNG-32 image with transparency.


### Toolbar Icons
Toolbar icons are taken from the [Open Icon Library](http://openiconlibrary.sourceforge.net/) and are liscenced under the [CC BY-SA 3.0 liscence](http://creativecommons.org/licenses/by-sa/3.0/).