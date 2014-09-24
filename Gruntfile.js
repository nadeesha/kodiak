/* jshint indent:false */

'use strict';

module.exports = function(grunt) {
    if (grunt.option('target') === 'stg' || grunt.option('target') === 'prod') {
        console.log('setting configuration: ', grunt.option('target'));
    } else {
        console.log('invalid --target: ', grunt.option('target'));
        return;
    }

    var pkg = require('./package.json');
    var env = grunt.option('target');

    var jsCopiedFromAppComponents = [
        'angular-sanitize/angular-sanitize.min.js',
        'ngprogress/build/ngProgress.min.js',
        'angular-loading-bar/build/loading-bar.min.js',
        'textAngular/textAngular.min.js',
        'ngQuickDate/dist/ng-quick-date.min.js',
        'ng-file-upload/angular-file-upload.js',
        'bootstrap/js/collapse.js',
        'angular-bindonce/bindonce.min.js',
        'angulartics/src/angulartics.js',
        'angulartics/src/angulartics-ga.js',
        'angular-facebook/lib/angular-facebook.js'
    ];

    var cssFilesCombined = [
        'app/components/allmighty-autocomplete/style/autocomplete.css',
        'app/css/bootstrap-theme.min.css',
        'app/components/pnotify/jquery.pnotify.default.css',
        'app/components/pnotify/jquery.pnotify.default.icons.css',
        'app/components/jquery-ui/themes/smoothness/jquery-ui.css',
        'app/components/angular-loading-bar/build/loading-bar.min.css',
        'app/components/ng-grid/ng-grid.min.css',
        'app/css/app.css'
    ];

    var jsFilesCombinedToAppJs = [
        'app/components/angular-bootstrap/ui-bootstrap-tpls.js',
        'app/components/angular-ui-slider/src/slider.js',
        'app/components/angular-ui-router/release/angular-ui-router.min.js',
        'app/components/pnotify/jquery.pnotify.js',
        'app/components/allmighty-autocomplete/script/autocomplete.js',
        'app/lib/ngStorage.js',
        'app/js/app.js',
        'app/js/services.js',
        'app/js/controllers.js',
        'app/js/filters.js',
        'app/js/directives.js',
        'app/js/uservoice.js',
        'app/js/config.' + grunt.option('target') + '.js',
        'app/js/3p.js'
    ];

    grunt.initConfig({
        clean: [
            'dist-' + env + '/**/*.js',
            'dist-' + env + '/**/*.css',
            'dist-' + env + '/**/*.jpg',
            'dist-' + env + '/**/*.html',
            'dist-' + env + '/Procfile',
            'dist-' + env + '/**/*.json',
            'dist-' + env + '/**/*.gz',
            'dist-' + env + '/**/*.map'
        ],

        // copy files that need no minification
        copy: {
            main: {
                files: [
                    // all the partials
                    {
                        expand: true,
                        cwd: 'app/partials/',
                        src: ['**'],
                        dest: 'dist-' + env + '/partials/',
                        filter: 'isFile'
                    },
                    // all the images
                    {
                        expand: true,
                        cwd: 'app/img/',
                        src: ['**'],
                        dest: 'dist-' + env + '/img/',
                        filter: 'isFile'
                    },
                    // js min files
                    {
                        expand: true,
                        cwd: 'app/components/',
                        src: jsCopiedFromAppComponents,
                        dest: 'dist-' + env + '/js/',
                        filter: 'isFile'
                    },
                    // fonts
                    {
                        expand: true,
                        cwd: 'app/fonts/',
                        src: ['**'],
                        dest: 'dist-' + env + '/fonts/',
                        filter: 'isFile'
                    }, {
                        expand: true,
                        src: ['package.json', 'Procfile'],
                        dest: 'dist-' + env + '/'
                    }
                ]
            }
        },

        // minify all js
        uglify: {
            options: {
                mangle: false
            },
            everything: {
                files: [{
                    src: jsFilesCombinedToAppJs,
                    dest: 'dist-' + env + '/js/app.js'
                }]
            }
        },

        // minify all css
        cssmin: {
            combine: {
                files: [{
                    src: 'dist-' + env + '/css/styles.css',
                    dest: 'dist-' + env + '/css/styles.min.css'
                }]
            }
        },

        // change the paths in index.html for css and js
        processhtml: {
            dist: {
                files: [{
                    src: 'app/index.html',
                    dest: 'dist-' + env + '/index.html'
                }]
            }
        },

        // start the server from the root, not the /app dir
        // therefore, make ./app -> ./
        'string-replace': {
            dist: {
                files: [{
                    src: 'server.js',
                    dest: 'dist-' + env + '/server.js'
                }],
                options: {
                    replacements: [{
                        pattern: 'app',
                        replacement: ''
                    }]
                }
            }
        },

        concat: {
            dist: {
                src: cssFilesCombined,
                dest: 'dist-' + env + '/css/styles.css'
            }
        },

        compress: {
            main: {
                options: {
                    mode: 'gzip',
                    pretty: true
                },
                expand: true,
                cwd: 'dist-' + env + '/',
                src: ['js/**/*.js', '**/*.css', '**/*.html', '**/*.jpg', '**/*.png', '**/*.woff'],
                dest: 'dist-' + env + '/'
            }
        },

        buildcontrol: {
            options: {
                commit: true,
                push: true,
                message: 'Built %sourceName% from commit %sourceCommit% on branch %sourceBranch%'
            },
            heroku: {
                options: {
                    dir: 'dist-' + env,
                    remote: env === 'stg' ? 'git@heroku.com:lentil-kodiak-stg.git' : 'git@heroku.com:lentil-kodiak.git',
                    branch: 'master'
                }
            }
        }
    });

    console.log('app/js/config.' + grunt.option('target') + '.js');

    // Load the plugin that provides the 'uglify' task.
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-processhtml');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-string-replace');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-build-control');

    // Default task(s).
    grunt.registerTask('default', [
        'clean',
        'concat',
        'processhtml',
        'copy',
        'string-replace',
        'cssmin',
        'uglify',
        'compress',
        'buildcontrol:heroku'
    ]);
};