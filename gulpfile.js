const { src, dest, series, watch } = require("gulp");
const ejs = require("gulp-ejs");
const rename = require("gulp-rename");
const del = require("del");
const sass = require('gulp-sass');
const browserSync = require('browser-sync').create();

const PATH = {
  ejs: "src/templates",
  scss: "src/scss",
  dist: "dist"
}

const clean = () => del(PATH.dist);

const html = () => src(`${PATH.ejs}/*.ejs`)
  .pipe(ejs())
  .pipe(rename({ extname: '.html' }))
  .pipe(dest(PATH.dist));

const css = () => src(`${PATH.scss}/*.scss`)
  .pipe(sass({
    errLogToConsole: true,
    outputStyle: 'compact',
    onError: browserSync.notify
  }))
  .pipe(dest(`${PATH.dist}/css`))
  .pipe(browserSync.stream());


exports.default = series(clean, html, css);
