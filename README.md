Untold Stories :: README
====================

![ScreenShot](http://www.daveidol.com/images/projects/untoldstories.png)


Description
---------------------

Tell your own story any way you want in a game where absolutely anything goes. ***Untold Stories***: a multiplayer storytelling game in your browser.

Credits
---------------------
Untold Stories was developed by [Dave Idol](http://daveidol.com), [Chris Hendel](http://chrishendel.com), and Shawn Waldon.


Deployment
---------------------

The application has different settings for a production environment than a development environment: for example the listening port may be different or the level of debug statements may be different. Rather than hardcode the environment in the application code (which would require maintaining multiple versions of the code), the environment variable `$NODE_ENV` is set to "production" or "development" accordingly (if it is not set then it defaults to development). This is a standard practice among NodeJS applications.

Installation & Quick Intro to Node
-----------------------------------

After checking out the code (and installing Node.js) run the following command: `$ npm install`

This will install all of the dependencies for the application based on the package.json file.

Next, simply run: `$ node server.js`

And then open your web browser to [the localhost page](http://localhost:8887).

### Dependencies with npm
If the dependencies of the project change you can fix your local install by running `$ npm prune` (to remove any unnecessary dependencies) and then `$ npm install` (to install new dependencies).

Testing
---------------------

### Automated Testing

Coming soon (this is a great place for someone to contribute!)

### Manual Testing

In order to make testing easier, special URLs exist ([/player](http://localhost:8888/player) and [/creator](http://localhost:8888/creator)) to automatically join a matchmaking game without having to type in a username, select Creator or Player, etc. each time. These URLs can be bookmarked and reloaded to easily join a game for testing purposes. Note these URLs are not accessible in a production environment.

### Debugging client
If you are new to debugging client-side JS it is recommended that you use [Firebug](http://getfirebug.com/) or the Chrome development console (F12 in Chrome).

Directories
---------------------

The `public/` directory is used for any static files (files served to the client as-is). The client can reference these files without including the "public" part of the URI (so `/public/images/img.jpg` can be referenced as just `images/img.jpg` on the client).

The `client/` directory is used in conjunction with Browserify to generate a single JS bundle for the browser to load. This is done via the [browserify-middleware](https://github.com/ForbesLindesay/browserify-middleware) module.

Style Guidelines
--------------------

### OOP
Try to avoid using the global namespace as much as possible. Instead, use the CommonJS `require` syntax to [encapsulate your objects like you would in a language like Java or C++](http://smorgasbork.com/component/content/article/38-titanium-mobile/132-titanium-mobile-commonjs-fundamentals).

This module technique is used by default on the server, and [Browserify](https://github.com/substack/node-browserify#browserify) is used to make it work on the client.

### Events
Use the [event (aka observer) pattern](http://en.wikipedia.org/wiki/Observer_pattern) to avoid having to pass around an excessive amount of objects or break encapsulation. Both the client and the server can use the [Node.js EventEmitter API](http://nodejs.org/api/events.html) to expose and raise events.

Remember: it is almost always the event listener's responsibility (not the event generator's) to remove any listeners it registers.

### Comments
Classes and functions can/should be documented using the [JSDoc syntax](http://en.wikipedia.org/wiki/JSDoc). If you are using Sublime Text then install the [DockBlockr plugin](https://tutsplus.com/lesson/docblockr/) to automatically generate these comments for you.


Licenses & Attribution
--------------------

Untold Stories is open source, licensed under the [Creative Commons BY-NC-SA license](http://creativecommons.org/licenses/by-nc-sa/3.0/), except where otherwise noted.

All other open source libraries used that are not directly part of Untold Stories are placed in an "external" directory.

The artwork assets in the game are licensed as follows:

### Tileset images
All of the 16x16 tileset images used [can be found on opengameart.org](http://opengameart.org/content/oga-16x16-jrpg-sprites-tiles). All credit for the original sprite images goes to [CharlesGabriel](http://opengameart.org/users/charlesgabriel), [MrBeast](http://opengameart.org/users/mrbeast), and [Daniel Siegmund](http://opengameart.org/content/16x16-pixel-art-dungeon-wall-and-cobblestone-floor-tiles), whose work is distributed under the [CC BY license](http://creativecommons.org/licenses/by/3.0/). The [forrest tiles](http://opengameart.org/content/forest-tiles) are in the [public domain](http://creativecommons.org/publicdomain/zero/1.0/).

### Toolbar Icons
Toolbar icons are taken from the [Open Icon Library](http://openiconlibrary.sourceforge.net/) and are licensed under the [CC BY-SA 3.0 license](http://creativecommons.org/licenses/by-sa/3.0/).