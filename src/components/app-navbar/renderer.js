var template = require('marko').load(require.resolve('./template.marko'));

module.exports = function(input, out) {
    var viewModel = input;

    template.render(viewModel, out);
};