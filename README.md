Tabula Rasa Readme
====================

Installation
---------------------

After checking out the code (and installing Node.js and npm) run the following command:
`$ npm install -l`

This will install all of the dependencies for the application based on the package.json file.

Next, simply run:
`$ node server.js`

And then open your web browser to [the localhost page](http://localhost:8888).

### Note
It is recommended for debugging that you use [Firebug](http://getfirebug.com/) (although the Chrome development console will work almost as well).


Directories
---------------------

The resources/ directory is used for any static files (files served to the client as-is). The client can reference these files without including the "resources" part of the URI (so /resources/js/client.js can be referenced as just js/client.js on the client).