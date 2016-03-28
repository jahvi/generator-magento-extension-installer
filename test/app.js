'use strict';
var path = require('path');
var helpers = require('yeoman-test');

describe('generator-magento-extension-installer:app', function () {
  before(function (done) {
    helpers.run(path.join(__dirname, '../generators/app'))
      .withPrompts({someAnswer: true})
      .on('end', done);
  });
});
