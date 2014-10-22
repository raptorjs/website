var compiler = require('marko/compiler');
var marko = require('marko');

compiler.taglibs.registerTaglib(require.resolve('./test-taglib/marko-taglib.json'));

window.testTemplate = marko.load(require.resolve('./include-target.marko'));

function getUniqueSampleName(category, sample) {
    var catName = category.name;
    var sampleName = sample.name;
    return (catName + '_' + sampleName).replace(/\W+/g, '_');
}

function Widget(widgetConfig) {
    var _this = this;

    var widgets = this.widgets;
    var autoRender = true;
    var compileRequired = true;
    var renderRequired = true;
    var currentSample = null;

    var editorsState = {
        data: null,
        options: null,
        dataModified: true,
        optionsModified: true,
    };

    var currentCategoryId = null;
    var currentSampleId = null;
    var halt = false;

    var samples = widgetConfig.samples;

    var samplesById = {};
    var categoriesById = {};
    var samplesByName = {};

    var templateCreateFunc;
    var changeHash = true;

    var $htmlViewer = this.$("#htmlViewer");

    samples.categories.forEach(function(category) {
        categoriesById[category.id] = category;

        category.samples.forEach(function(sample) {
            sample.category = category;
            samplesById[sample.id] = sample;
            sample.uniqueName = getUniqueSampleName(category, sample);
            samplesByName[sample.uniqueName] = sample;
        });
    });

    this.$().on('click', '.mto-category-btn', function() {
        var categoryId = this.getAttribute('data-cat-id');
        if (categoryId == null) {
            return;
        }

        categoryId = parseInt(categoryId, 10);
        _this.showCategory(categoryId);
    });

    this.$().on('click', '.mto-sample-btn', function() {
        var sampleId = this.getAttribute('data-sample-id');
        if (sampleId == null) {
            return;
        }

        sampleId = parseInt(sampleId, 10);
        _this.showSample(sampleId);
    });

    widgets.templateEditor.on('change', function() {
        compileRequired = true;
        renderRequired = true;

        if (autoRender) {
            _this.update();
        }
    });

    widgets.dataEditor.on('change', function() {
        editorsState.dataModified = true;
        renderRequired = true;

        if (autoRender) {
            _this.update();
        }
    });

    widgets.optionsEditor.on('change', function() {
        editorsState.optionsModified = true;
        renderRequired = true;
        compileRequired = true;

        if (autoRender) {
            _this.update();
        }
    });

    // widgets.optionsEditor.on('change', function() {
    //     editorsState.optionsModified = true;
    //     compileRequired = true;
    //     renderRequired = true;
    //
    //     if (autoRender) {
    //         _this.update();
    //     }
    // });

    this.showCategory = function(categoryId) {
        var category = categoriesById[categoryId];
        if (!category || category.samples.length === 0) {
            return;
        }

        this.showSample(category.samples[0].id);
    };

    this.showSample = function(sampleId) {
        if (currentSampleId === sampleId) {
            return;
        }

        var sample = samplesById[sampleId];

        if (!sample) {
            return;
        }

        currentSample = sample;

        var categoryId = sample.category.id;

        if (currentCategoryId !== categoryId) {
            if (currentCategoryId !== -1) {
                this.$('.mto-category-btn[data-cat-id="' + currentCategoryId + '"]').removeClass('mto-btn-active');
                this.$('.mto-sample-nav[data-cat-id="' + currentCategoryId + '"]').removeClass('mto-sample-nav-active');
            }

            currentCategoryId = categoryId;

            this.$('.mto-category-btn[data-cat-id="' + currentCategoryId + '"]').addClass('mto-btn-active');
            this.$('.mto-sample-nav[data-cat-id="' + currentCategoryId + '"]').addClass('mto-sample-nav-active');

            // Select the first sample

            var category = categoriesById[categoryId];

            if (sampleId == null) {
                if (category.samples.length) {
                    sampleId = category.samples[0].id;
                }
            }

            if (category.samples.length === 1) {
                this.$('#sampleNavs').hide();
            } else {
                this.$('#sampleNavs').show();
            }
        }

        if (currentSampleId !== -1) {
            this.$('.mto-sample-btn[data-sample-id="' + currentSampleId + '"]').removeClass('mto-btn-active');
        }

        currentSampleId = sampleId;

        this.$('.mto-sample-btn[data-sample-id="' + currentSampleId + '"]').addClass('mto-btn-active');

        if (sample.options) {
            this.$('#optionsContainer').show();
        } else {
            this.$('#optionsContainer').hide();
        }


        var template = sample.template;
        var data = sample.data;
        var options = sample.options;
        var autoFormat = sample.autoFormat === true;

        widgets.outputEditor.setAutoFormat(autoFormat);

        halt = true;

        widgets.dataEditor.setValue(data || '{\n}');

        if (options) {
            widgets.optionsEditor.setValue(options);
        }

        widgets.templateEditor.setValue(template);

        halt = false;

        this.update();

        if (changeHash !== false) {
            document.location.hash = sample.uniqueName;
        }
    };

    this.handleEditorException = function(errorsWidget, e) {
        var errors = e.errors;

        if (!errors) {
            errors = [{message: e.toString()}];
        }

        errorsWidget.addErrors(errors);
    };

    function compileAndLoadTemplate(templateSrc, path, compileOptions, callback) {
        try {
            compiler.compile(templateSrc, path, compileOptions, function(err, compiledSrc) {
                if (err) {
                    return callback(err);
                }

                var wrappedSource = '(function(require, exports, module, __filename, __dirname) { ' + compiledSrc + ' })';
                var factoryFunc = eval(wrappedSource);
                var templateExports = {};
                var templateModule = {
                    require: require,
                    exports: templateExports,
                    id: '/template.marko'
                };

                factoryFunc(require, templateExports, templateModule, '/template.marko', '/');
                callback(null, templateModule.exports, compiledSrc);
            });
        } catch(e) {
            if (window.console) {
                console.error(e);
            }

            callback(e);
        }

    }

    this.compileTemplate = function() {
        if (!compileRequired) {
            return;
        }

        widgets.templateErrors.clearErrors();

        var templateSrc = widgets.templateEditor.getValue();
        var pseudoPath = '/template.marko';

        var compileOptions = currentSample.options ?
            editorsState.optionsData :
            null;

        compileAndLoadTemplate(
            templateSrc,
            pseudoPath,
            compileOptions,
            function(err, _templateCreateFunc, compiledSrc) {
                if (err) {
                    _this.handleEditorException(widgets.templateErrors, err);
                    return;
                }

                templateCreateFunc = _templateCreateFunc;

                widgets.compiledEditor.setValue(compiledSrc);
                compileRequired = false;
            });
    };

    this.renderTemplate = function() {
        if (!renderRequired) {
            return;
        }

        var template = marko.load(templateCreateFunc);
        var viewModel = editorsState.templateData;

        try {
            template.render(viewModel, function(err, html) {
                if (err) {
                    this.handleEditorException(widgets.templateErrors, err);
                    $htmlViewer.html('');
                    return;
                }

                widgets.outputEditor.setValue(html);
                $htmlViewer.html(html);
            });
        } catch(err) {
            this.handleEditorException(widgets.templateErrors, err);
            $htmlViewer.html('');
        }


        this.renderRequired = false;
    };

    this.updateJSON = function(targetProp, modifiedProp, editor, errors) {
        if (!editorsState[modifiedProp]) {
            return;
        }

        editorsState[targetProp] = null;
        errors.clearErrors();

        var jsonData = editor.getValue();

        var data;

        if (jsonData.trim() === '') {
            data = {};
        } else {
            try {
                data = eval("(" + jsonData + ")");
                editorsState[targetProp] = data;
            } catch(e) {
                this.handleEditorException(errors, e);
            }
        }

        editorsState[modifiedProp] = false;
    };

    this.update = function() {
        if (halt) {
            return;
        }

        this.updateJSON('optionsData', 'optionsModified', widgets.optionsEditor, widgets.optionsErrors);
        this.compileTemplate();
        this.updateJSON('templateData', 'dataModified', widgets.dataEditor, widgets.dataErrors);

        this.renderTemplate();
    };

    if (document.location.hash) {
        var sample = samplesByName[document.location.hash.substring(1)];
        if (sample) {
            this.showSample(sample.id);
        } else {
            this.showCategory(samples.categories[0].id);
        }
    } else {
        changeHash = false;
        this.showCategory(samples.categories[0].id);
        changeHash = true;
    }



    window.addEventListener("hashchange", function() {
        var sample = samplesByName[document.location.hash.substring(1)];
        if (sample) {
            _this.showSample(sample.id);
        }
    }, false);

}


module.exports = Widget;