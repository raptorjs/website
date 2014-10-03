require('app-module-path').addPath(__dirname);

var series = require('raptor-async/series');
var fs = require('fs');
var nodePath = require('path');
var routes = require('./routes.js');
var mkdirp = require('mkdirp');

require('./config').configure({
    static: true
});

require('./config').onConfigured(function(err, config) {
    if (err) {
        throw err;
    }

    var baseDir = config.outDir;

    var renderTasks = Object.keys(routes).map(function(path) {
        var handler = routes[path];

        return function(callback) {
            var outDir = nodePath.join(baseDir, path);
            var outFile = nodePath.join(outDir, 'index.html');
            mkdirp(outDir, function() {
                var out = fs.createWriteStream(outFile);
                console.log('Rendering route "' + path + '" to "' + nodePath.relative(process.cwd(), outFile) + '"...');

                out
                    .on('error', function(err) {
                        callback(err);
                    })
                    .on('close', function() {
                        console.log('Completed rendering route "' + path + '"');
                    });

                handler({}, out);
            });
        };
    });

    series(renderTasks, function(err) {
        if (err) {
            console.error('Error: ', err);
            return;
        }

        console.log('Website successful generated to "' + outDir + '"!');
    });
});