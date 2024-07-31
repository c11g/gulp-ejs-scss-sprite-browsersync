import { src, dest, series, parallel, watch } from "gulp";
import ejs from "gulp-ejs";
import rename from "gulp-rename";
import { deleteAsync } from "del";
import sourcemaps from "gulp-sourcemaps";
import browserSyncModule from "browser-sync";
import generateIndxing from "generate-index";
import minifyHtml from "gulp-html-minifier";
import prettyHtml from "gulp-pretty-html";
import autoprefixer from "gulp-autoprefixer";
import babel from "gulp-babel";
import * as dartSass from "sass";
import gulpSass from "gulp-sass";
const sass = gulpSass(dartSass);
const browserSync = browserSyncModule.create();

const PATH = {
  ejs: "src/views",
  scss: "src/scss",
  js: "src/js",
  assets: "src/assets",
  dist: "dist",
};

const html = () =>
  src(`${PATH.ejs}/*.ejs`)
    .pipe(ejs())
    .pipe(rename({ extname: ".html" }))
    .pipe(dest(PATH.dist));

const css = () =>
  src(`${PATH.scss}/*.scss`)
    .pipe(sourcemaps.init())
    .pipe(
      sass({
        errLogToConsole: true,
        outputStyle: "expanded",
        onError: browserSync.notify,
      })
    )
    .pipe(sourcemaps.write("./maps"))
    .pipe(dest(`${PATH.dist}/css`))
    .pipe(browserSync.stream());

const js = (_) =>
  src(`${PATH.js}/**/*.js`)
    .pipe(dest(`${PATH.dist}/js`))
    .pipe(browserSync.stream());

const assets = (_) =>
  src(`${PATH.assets}/**/*`, {
    buffer: true,
    removeBOM: false,
  }).pipe(dest(`${PATH.dist}/assets`));

const clean = () => deleteAsync(`${PATH.dist}/**`);

const serve = () => {
  browserSync.init({
    server: {
      baseDir: PATH.dist,
      directory: true,
    },
    open: false,
  });

  watch(`${PATH.ejs}/**/*.ejs`, html);
  watch(`${PATH.scss}/**/*.scss`, css);
  watch(`${PATH.js}/**/*.js`, js);
  watch(`${PATH.assets}/**/*`, assets);
  watch(`${PATH.dist}/*.html`).on("change", browserSync.reload);
};

const index = async () => {
  await generateIndxing({
    projectName: "A Dot",
    author: "c11g",
    srcDir: `${PATH.dist}/`,
    extention: ".html",
    outFileName: "@index.html",
  });
};

const prettier = async () => {
  src(`${PATH.dist}/*.html`)
    .pipe(
      await minifyHtml({
        collapseWhitespace: true,
        minifyCSS: true,
      })
    )
    .pipe(
      prettyHtml({
        indent_size: 2,
      })
    )
    .pipe(dest(PATH.dist));
};

const cssPrefixer = () =>
  src(`${PATH.dist}/css/*.css`)
    .pipe(autoprefixer())
    .pipe(dest(`${PATH.dist}/css`));

const jsBable = () =>
  src(`${PATH.dist}/js/script.js`)
    .pipe(
      babel({
        presets: ["@babel/preset-env"],
      })
    )
    .pipe(dest(`${PATH.dist}/js`));

const dev = series(clean, parallel(html, css, js), assets);

export const build = series(
  dev,
  parallel(cssPrefixer, jsBable),
  index,
  prettier
);
export default series(dev, serve);
