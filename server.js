require('app-module-path').addPath(__dirname);

var express = require('express');
var serveStatic = require('serve-static');

require('./config').configure({
    static: false
});

require('./config').onConfigured(function(err, config) {
    if (err) {
        throw err;
    }
    var app = express();

    var port = config.port;

    app.use('/static', serveStatic(__dirname + '/static'));

    var routes = require('./routes');

    var routePaths = Object.keys(routes);
    routePaths.sort();
    routePaths.reverse(); // Descending

    routePaths.forEach(function(path) {
        var handler = routes[path];
        app.get(path, function(req, res) {
            handler(req, res);
        });
    });

    app.listen(port, function() {
        console.log('Listening on port %d', port);

        if (process.send) {
            process.send('online');
        }
    });
});