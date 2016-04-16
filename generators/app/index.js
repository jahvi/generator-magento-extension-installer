'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var isGithubUrl = require('is-github-url');
var gh = require('parse-github-url');

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
      var fs = this.fs;

      // Install from github url
      if (isGithubUrl(source, {repository: true})) {
        var repo = gh(source);

        this.remote(repo.owner, repo.name, repo.branch, function (err, remote) {
          if (err) {
            log(err);
          }

          // Ignore top level files
          fs.copy('*/**', '.', {globOptions: {dot: true, cwd: remote.cachePath}});
        });

      // Extract from archive URL
      } else {
        this.extract(source, '.', function (err) {
          if (err) {
            log(err);
          }

          // Delete unnecessary files
          fs.delete('package.xml');
        });
      }
    }
  }
});
