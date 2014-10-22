var codeMirrorFactory = require('codemirror');
var html = require('html');

function Widget(widgetConfig) {
    this.autoFormat = widgetConfig.autoFormat === true;
    var _this = this;

    this.mode = widgetConfig.mode;


    var codeMirrorConfig = {
        value: widgetConfig.code || '',
        mode: widgetConfig.mode,
        lineNumbers: widgetConfig.lineNumbers !== false,
        readOnly: widgetConfig.readOnly === true
    };

    if (widgetConfig.autoResize) {
        codeMirrorConfig.viewportMargin = Infinity;
    }

    if (widgetConfig.theme) {
        codeMirrorConfig.theme = widgetConfig.theme;
    }

    this.codeMirror = codeMirrorFactory(this.el, codeMirrorConfig);

    this.codeMirror.on('change', function(editor) {
        _this.emit('change', {
            codeEditor: _this,
            value: editor.getValue()
        });
    });
}

Widget.prototype = {
    getTextArea: function() {
        return this.codeMirror.getTextArea();
    },

    getValue: function() {
        return this.codeMirror.getValue();
    },

    setValue: function(value) {
        if (this.autoFormat) {
            value = this.format(value);
        }

        this.codeMirror.setValue(value);
    },

    setAutoFormat: function(autoFormat) {
        if (this.autoFormat === autoFormat) {
            return;
        }

        this.autoFormat = autoFormat === true;

        if (this.autoFormat) {
            this.setValue(this.format(this.getValue()));
        }
    },

    isAutoFormat: function() {
        return this.autoFormat === true;
    },

    format: function(code) {
        if (this.mode !== 'htmlmixed') {
            return code;
        }

        code = html.prettyPrint(code);
        return code;
    }
};

module.exports = Widget;