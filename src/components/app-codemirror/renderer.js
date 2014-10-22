var template = require('marko').load(require.resolve('./template.marko'));

module.exports = function(input, out) {
    var autoResize = input.autoResize === true;

    template.render({
            widgetConfig: {
                code: input.code,
                mode: input.mode,
                autoResize: autoResize,
                readOnly: input.readOnly === true,
                autoFormat: input.autoFormat === true,
                theme: input.theme
            },
            autoResize: autoResize
        }, out);
};