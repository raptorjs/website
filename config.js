var nodePath = require('path');

function configureApp(config, callback) {
    console.log('optimizer config: ', config.optimizer);
    require('optimizer').configure(config.optimizer);
    callback();
}


var loadedConfig = null;

var commandLineArgs = require('raptor-args')
    .createParser({
        '--help': {
            type: 'string',
            description: 'Show this help message'
        },
        '--port -p': {
            type: 'number',
            description: 'Port number to listen on'
        },
        '--mock-services': {
            type: 'boolean',
            description: 'Enable mock services that return fake data'
        },
        '--development --dev -d': {
            type: 'boolean',
            description: 'Use development environment settings'
        },
        '--out-dir --out -o': {
            type: 'boolean',
            description: 'Output directory for static builds'
        }
    })
    .usage('Usage: $0 server [options]')
    .example(
        'Start the server on port 8080',
        '$0 server --port 8080')
    .validate(function(result) {
        if (result.help) {
            this.printUsage();
            process.exit(0);
        }
    })
    .onError(function(err) {
        this.printUsage();
        console.error(err);
        process.exit(1);
    })
    .parse();

var configHandle;

exports.configure = function(options) {

    var outDir = commandLineArgs.outDir = commandLineArgs.outDir || nodePath.join(__dirname, '../raptorjs.github.com');

    var staticOverrides = {};

    if (options.static) {
        staticOverrides = {
            optimizer: {
                fileWriter: {
                    outputDir: nodePath.join(outDir, 'static')
                }
            }
        };
    }
    configHandle = require('async-config').load(
        nodePath.join(__dirname, 'config/config.json'),
        {
            environment: commandLineArgs.development ? 'development' : 'production',
            overrides: [
                commandLineArgs,
                staticOverrides
            ],
            finalize: configureApp,
            defaults: [
                { port: 8080 }
            ]
        },
        function(err, config) {
            if (err) {
                throw err;
            }

            loadedConfig = config;
        });
};

/**
 * Synchronous API to return the loaded configuration:
 */
exports.get = function() {
    if (!loadedConfig) {
        throw new Error('Configuration has not been fully loaded!');
    }

    return loadedConfig;
};

/**
 * Add a listener to be added for when the configuration is fully loaded.
 * If the configuration has already been fully loaded then the listener
 * will be invoked immediately.
 */
exports.onConfigured = function(callback) {
    configHandle.done(callback);
};