'use strict';

var gulp = require('gulp'),
  gulpFilter = require('gulp-filter'),
  concat = require('gulp-concat'),
  uglify = require('gulp-uglify'),
  gulpBowerFiles = require('gulp-bower-files');

var jsFilter = gulpFilter('**/*.js', '!**/*.min.js');

gulp.task('bower-js-files', function() {
  gulpBowerFiles({
    bowerDirectory: 'app/components',
    bowerrc: '.bowerrc',
    bowerJson: 'bower.json'
  })
    .pipe(jsFilter)
    .pipe(uglify())
    .pipe(concat('bower-bundle.js'))
    .pipe(gulp.dest('./gulp-build/'));
});