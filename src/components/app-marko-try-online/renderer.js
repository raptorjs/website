var samples = require('./samples-loader').load();
var template = require('marko').load(require.resolve('./template.marko'));

module.exports = function render(input, out) {

    template.render({
        widgetConfig: {
            samples: samples
        },
        samples: samples
    }, out);
};