'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var isGithubUrl = require('is-github-url');
var gh = require('parse-github-url');
var glob = require('glob');
var fs = require('fs-extra');

module.exports = yeoman.Base.extend({

  prompting: function () {
    var done = this.async();

    var ml = [
      '',
      chalk.red('     .\'\'-`'),
      chalk.red('    ...\'\'\'.'),
      chalk.red('   .`  `\'\'\'-     `......``'),
      chalk.red('  .`    .\'\'\'\'..\'\'\'\'\'\'\'.`..\'.`'),
      chalk.red(' ..      `\'\'\'\'\'\'\'\'\'.`       `..`'),
      chalk.red('`.         `.....`              ``'),
      ''
    ].join('\n');

    this.log(ml);

    var prompts = [{
      type: 'input',
      name: 'source',
      message: 'What is the location of the extension?'
    }];

    this.prompt(prompts, function (props) {
      this.props = props;
      done();
    }.bind(this));
  },

  writing: {
    fetch: function () {
      var source = this.props.source;
      var log = this.log;

      // Install from github url
      if (isGithubUrl(source, {repository: true})) {
        var repo = gh(source);

        this.remote(repo.owner, repo.name, repo.branch, function (err, remote) {
          // Ignore top level files
          var files = glob.sync('*/**', {dot: true, nodir: true, cwd: remote.cachePath});

          for (var i in files) {
            fs.copy(remote.cachePath + '/' + files[i], files[i]);
            log.create(files[i]);
          }
        });

      // Extract from archive URL
      } else {
        this.extract(source, '.', function (err) {
          if (err) {
            log(err);
          }

          fs.remove('package.xml');
        });
      }
    }
  }
});
