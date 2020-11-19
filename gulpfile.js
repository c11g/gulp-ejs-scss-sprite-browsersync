const { src, dest, series, parallel, watch } = require("gulp");
const ejs = require("gulp-ejs");
const rename = require("gulp-rename");
const del = require("del");
const sass = require("gulp-sass");
const sourcemaps = require("gulp-sourcemaps");
const spritesmith = require("gulp.spritesmith");
const merge = require("merge-stream");
const browserSync = require("browser-sync").create();
const generateIndxing = require("generate-index");
const minifyHtml = require("gulp-html-minifier");
const prettyHtml = require("gulp-pretty-html");
const autoprefixer = require("gulp-autoprefixer");
const babel = require("gulp-babel");

const PATH = {
  ejs: "src/views",
  scss: "src/scss",
  js: "src/js",
  assets: "src/assets",
  sprites: "src/sprites",
  sprite_scss: "src/scss/common",
  sprite_image: "src/assets/images",
  dist: "dist"
};

const html = () => src(`${PATH.ejs}/*.ejs`)
  .pipe(ejs())
  .pipe(rename({ extname: ".html" }))
  .pipe(dest(PATH.dist));

const css = () => src(`${PATH.scss}/*.scss`)
  .pipe(sourcemaps.init())
  .pipe(sass({
    errLogToConsole: true,
    outputStyle: "compact",
    onError: browserSync.notify
  }))
  .pipe(sourcemaps.write("./maps"))
  .pipe(dest(`${PATH.dist}/css`))
  .pipe(browserSync.stream());

const js = _ => src(`${PATH.js}/*.js`)
  .pipe(dest(`${PATH.dist}/js`))
  .pipe(browserSync.stream());;

const assets = _ => src(`${PATH.assets}/**/*`)
  .pipe(dest(`${PATH.dist}/assets`));

const clean = () => del(`${PATH.dist}/**`);

const sprite = _ => {
  const spriteData = src(`${PATH.sprites}/*.png`)
    .pipe(spritesmith({
      imgName: "sprite.png",
      padding: 2,
      cssName: "_sprite.scss",
      imgPath: `images/sprite.png`
    }));
  
  const imgStream = spriteData.img.pipe(dest(PATH.sprite_image));
  const cssStream = spriteData.css.pipe(dest(PATH.sprite_scss));
  return merge(imgStream, cssStream);
}

const serve =  () => {
  browserSync.init({
    server: {
      baseDir: PATH.dist,
      directory: true,
    },
    open: false,
  })

  watch(`${PATH.ejs}/**/*.ejs`, html);
  watch(`${PATH.scss}/**/*.scss`, css);
  watch(`${PATH.js}/*.js`, js);
  watch(`${PATH.assets}/**/*`, assets);
  watch(`${PATH.sprites}/**/*`, sprite);
  watch(`${PATH.dist}/*.html`).on("change", browserSync.reload);
}

const index = async () => {
  await generateIndxing({
    projectName: "Enter a Project Name",
    author: "Enter a user name",
    srcDir: `${PATH.dist}/`,
    extention: ".html",
    outFileName: "@index.html"
  })
}

const prettier = async () => {
  src(`${PATH.dist}/*.html`)
  .pipe(await minifyHtml({
    collapseWhitespace: true,
    minifyCSS: true,
  }))
  .pipe(prettyHtml({
    indent_size: 2,
  }))
  .pipe(dest(PATH.dist))
}

const cssPrefixer = () =>
  src(`${PATH.dist}/css/*.css`)
  .pipe(autoprefixer())
  .pipe(dest(`${PATH.dist}/css`))

const jsBable = () =>
  src(`${PATH.dist}/js/script.js`)
  .pipe(babel({
    presets: ['@babel/preset-env']
  }))
  .pipe(dest(`${PATH.dist}/js`))

  const dev = series(clean, sprite, parallel(html, css, js), assets);
  const build = series(dev, parallel(cssPrefixer, jsBable), index, prettier);
  
  exports.build = build;
  exports.default = series(dev, serve);