/* jshint indent:false */

'use strict';

module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);

    if (grunt.option('target') === 'stg' || grunt.option('target') === 'prod') {
        console.log('setting configuration: ', grunt.option('target'));
    } else {
        console.log('invalid --target: ', grunt.option('target'));
        return;
    }

    var env = grunt.option('target');

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
                    // index.html
                    {
                        expand: true,
                        cwd: 'app/',
                        src: ['index.html'],
                        dest: 'dist-' + env + '/',
                        filter: 'isFile'
                    },
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

        // change the paths in index.html for css and js
        // processhtml: {
        //     dist: {
        //         files: [{
        //             src: 'app/index.html',
        //             dest: 'dist-' + env + '/index.html'
        //         }]
        //     }
        // },

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

        filerev: {
            dist: {
                src: [
                    'dist-' + env + '/js/{,*/}*.js',
                    'dist-' + env + '/css/{,*/}*.css',
                    'dist-' + env + '/img/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
                    'dist-' + env + '/fonts/*'
                ]
            }
        },

        // Reads HTML for usemin blocks to enable smart builds that automatically
        // concat, minify and revision files. Creates configurations in memory so
        // additional tasks can operate on them
        useminPrepare: {
            html: 'app/index.html',
            options: {
                dest: 'dist-' + env,
                flow: {
                    html: {
                        steps: {
                            js: ['concat', 'uglifyjs'],
                            css: ['cssmin']
                        },
                        post: {}
                    }
                }
            }
        },

        // Performs rewrites based on filerev and the useminPrepare configuration
        usemin: {
            html: ['dist-' + env + '/{,*/}*.html'],
            css: ['dist-' + env + '/css/{,*/}*.css'],
            options: {
                basedir: 'dist-' + env,
                dirs: 'dist-' + env                
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

    // Default task(s).
    grunt.registerTask('default', [
        'clean',
        'copy',
        'string-replace',
        'useminPrepare',
        'concat:generated',
        'cssmin:generated',
        'uglify:generated',
        'filerev',
        'usemin',
        'compress',
        'buildcontrol:heroku'
    ]);
};
