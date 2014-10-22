var errorsTemplate = require('marko').load(require.resolve('./errors-template.marko'));

function Widget() {

}

Widget.prototype = {
    setErrors: function(errors) {
        this.$().empty();
        
        if (errors && errors.length) {
            this.addErrors(errors);
        } else {
            this._hasErrors = false;
            this.$().hide();
        }
    },

    clearErrors: function() {
        this.setErrors(null);
    },

    hasErrors: function() {
        return this._hasErrors;
    },

    addErrors: function(errors) {
        if (errors && errors.length) {
            this._hasErrors = true;

            var html = errorsTemplate.renderSync(
                {
                    errors: errors
                });


            this.$().append(html);
            this.$().show();
        }
    }
};

module.exports = Widget;