import gulp from 'gulp';
import { deleteAsync } from 'del';
import browserify from 'browserify';
import browserSyncLib from 'browser-sync';
import source from 'vinyl-source-stream';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

const browserSync = browserSyncLib.create();

const destDir = 'dist/';

gulp.task('clean', function () {
  return deleteAsync([destDir]);
});

gulp.task('clean-temp', function () {
  return deleteAsync(['playwright-report/', 'test-results/', '.playwright-mcp/']);
});

gulp.task('copy-resources', function () {
  return gulp
    .src(['app/graphics/*', 'app/sounds/*', 'app/fonts/*'], { base: 'app/', encoding: false })
    .pipe(gulp.dest(destDir + '/'));
});

gulp.task('generate-version', function (done) {
  const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
  let gitCommit = 'unknown';
  let gitBranch = 'unknown';

  try {
    gitCommit = execSync('git rev-parse --short HEAD').toString().trim();
    gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  } catch (e) {
    // Git not available - use timestamp as build identifier
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
    gitCommit = timestamp.substring(0, 12); // Use first 12 chars of timestamp as build ID
  }

  const versionInfo = `// Auto-generated file - do not edit
module.exports = {
  VERSION: '${pkg.version}',
  GIT_COMMIT: '${gitCommit}',
  GIT_BRANCH: '${gitBranch}',
  BUILD_DATE: '${new Date().toISOString()}'
};
`;

  writeFileSync('app/version.js', versionInfo);
  done();
});

gulp.task('build-js', function () {
  return browserify({
    entries: ['app/index.js'],
    noParse: ['./node_modules/progressbar.js/dist/progressbar.js'],
    transform: ['packageify', 'brfs']
  })
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(gulp.dest(destDir));
});

gulp.task('build-html', function (done) {
  const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
  const version = pkg.version;

  const html = readFileSync('app/index.html', 'utf8');
  const versionedHtml = html
    .replace('href="index.css"', `href="index.css?v=${version}"`)
    .replace('src="bundle.js"', `src="bundle.js?v=${version}"`);

  writeFileSync(`${destDir}/index.html`, versionedHtml);
  done();
});

gulp.task('build-css', function () {
  return gulp.src('app/**/*.css').pipe(gulp.dest(destDir + '/'));
});

gulp.task(
  'build',
  gulp.series('clean', 'generate-version', 'copy-resources', 'build-css', 'build-js', 'build-html')
);

gulp.task(
  'serve',
  gulp.series(
    'build',
    action(() => {
      browserSync.init({
        server: {
          baseDir: './dist'
        }
      });

      gulp.watch('app/**', gulp.series('build', action(browserSync.reload)));
    })
  )
);

function action(task) {
  return done => {
    task();
    done();
  };
}
