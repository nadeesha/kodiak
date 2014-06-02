'use strict';

var gulp = require('gulp');
var gulpFilter = require('gulp-filter');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var size = require('gulp-filesize');
var gulpBowerFiles = require('gulp-bower-files');
var minifyCSS = require('gulp-minify-css');
var jsFilter = gulpFilter('**/*.js', '!**/*.min.js');
var cssFilter = gulpFilter('**/*.css', '!**/*.min.css');
var args = require('yargs').argv;
var gulpif = require('gulp-if');
var uglify = require('gulp-uglify');

var isProduction = args.type === 'prod';
var isStaging = args.type === 'stg';

gulp.task('bower-js-bundle', function() {
    gulpBowerFiles({
        bowerDirectory: 'app/components',
        bowerrc: '.bowerrc',
        bowerJson: 'bower.json'
    })
        .pipe(jsFilter)
        .pipe(gulpif(isProduction || isStaging, uglify()))
        .pipe(size())
        .pipe(concat('bower-bundle.js'))
        .pipe(size())
        .pipe(gulp.dest('./gulp-build/'));
});

gulp.task('bower-css-bundle', function() {
    gulpBowerFiles({
        bowerDirectory: 'app/components',
        bowerrc: '.bowerrc',
        bowerJson: 'bower.json'
    })
        .pipe(cssFilter)
        .pipe(gulpif(isProduction || isStaging, minifyCSS()))
        .pipe(size())
        .pipe(concat('bower-bundle.css'))
        .pipe(size())
        .pipe(gulp.dest('./gulp-build/'));
});

gulp.task('js-bundle', function() {
    gulp.src('./app/js/*.js')
        .pipe(gulpif(isProduction || isStaging, uglify()))
        .pipe(size())
        .pipe(concat('bundle.js'))
        .pipe(size())
        .pipe(gulp.dest('./gulp-build/'));
});

gulp.task('css-bundle', function() {
    gulp.src('./app/css/*.css')
        .pipe(gulpif(isProduction || isStaging, minifyCSS()))
        .pipe(size())
        .pipe(concat('bundle.css'))
        .pipe(size())
        .pipe(gulp.dest('./gulp-build/'));
});

gulp.task('html-index', function() {
    gulp.src('./app/index.html')
        .pipe(gulp.dest('./gulp-build/'));
});

gulp.task('html-partials', function() {
    gulp.src('./app/partials/*.html')
        .pipe(gulp.dest('./gulp-build/partials/'));
});