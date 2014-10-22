var samples = require('./samples-loader').load();
var template = require('marko').load(require.resolve('./template.marko'));

module.exports = function render(input, out) {

    var theme = null; // 'monokai'

    template.render({
        widgetConfig: {
            samples: samples
        },
        samples: samples,
        theme: theme
    }, out);
};