var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var gulp = require('gulp');
var strip = require('gulp-strip-comments');

gulp.task('default', function () {
  gulp.src(['vendor/is-emitter/dist/event-emitter.js', 'vendor/jsmediator/dist/mediator.js', 'src/*.js'])
    .pipe(concat('ng-mediator.js'))
    .pipe(strip())
    .pipe(gulp.dest('dist'))
    .pipe(uglify())
    .pipe(rename('ng-mediator.min.js'))
    .pipe(gulp.dest('dist'));
});
