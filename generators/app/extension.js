'use strict';

var url = require('url');
var request = require('sync-request');
var parseString = require('xml2json');
var _ = require('lodash');

module.exports = {
  parseKey: function (key) {
    var keyVersion;
    var pool;
    var pathAsArray;
    var name;
    var version = '';

    // Get key version
    if (key.indexOf('connect20') >= 0) {
      keyVersion = '2.0';
    } else if (key.indexOf('magento-') >= 0) {
      keyVersion = '1.0';
    } else {
      return false;
    }

    // Get extension pool
    switch (keyVersion) {
      case '2.0':
        var uri = url.parse(key);
        var path = uri.path;
        pathAsArray = path.split('/');
        if (pathAsArray[1]) {
          pool = pathAsArray[1];
        }
        break;
      case '1.0':
        pathAsArray = key.split('/');
        var stringAsArray = pathAsArray[0].split('-');
        if (stringAsArray[1]) {
          pool = stringAsArray[1];
        }
        break;
      default:
        return false;
    }

    if (pool === undefined) {
      return false;
    }

    // Get extension version and name
    var extension = pathAsArray.pop();
    var extensionAsArray = extension.split('-');

    if (extensionAsArray[1]) {
      name = extensionAsArray[0];
      version = extensionAsArray[1];
    } else {
      name = extension;
    }

    if (name === undefined) {
      return false;
    }

    return {
      key: {
        value: key,
        version: keyVersion
      },
      extension: {
        name: name,
        pool: pool,
        version: version
      }
    };
  },

  getKeyForDl: function (parsedKey) {
    var originalKey = parsedKey.key.value;
    var keyAsArray = originalKey.split('-');

    return keyAsArray[0];
  },

  getVersion: function (parsedKey) {
    var url;

    if (parsedKey.extension.version !== '') {
      return parsedKey.extension.version;
    }

    switch (parsedKey.key.version) {
      case '2.0':
        url = this.getKeyForDl(parsedKey) + '/releases.xml';
        break;
      case '1.0':
        url = 'http://connect.magentocommerce.com/' + parsedKey.extension.pool + '/Chiara_PEAR_Server_REST/r/' + parsedKey.extension.name.toLowerCase() + '/allreleases.xml';
        break;
      default:
        return false;
    }

    // Fetch version list from magento xml
    var response = request('GET', url);

    // Parse xml and get latest version
    var xml = response.getBody().toString();
    var result = parseString.toJson(xml, {object: true});
    var filteredVersions;
    var lastVersion;

    switch (parsedKey.key.version) {
      case '2.0':
        if (result.releases.r instanceof Array) {
          filteredVersions = result.releases.r.filter(function (item) {
            return item.s === 'stable';
          });

          filteredVersions = _.map(filteredVersions, 'v');
          lastVersion = _.max(filteredVersions);

          return lastVersion;
        }
        return result.releases.r.v;
      case '1.0':
        if (result.a.r instanceof Array) {
          filteredVersions = result.a.r.filter(function (item) {
            return item.s === 'stable';
          });

          filteredVersions = _.map(filteredVersions, 'v');
          lastVersion = _.max(filteredVersions);

          return lastVersion;
        }
        return result.a.r.v;
      default:
        return false;
    }
  },

  getDownloadUrl: function (parsedKey) {
    var extVersion = this.getVersion(parsedKey);

    switch (parsedKey.key.version) {
      case '2.0':
        // pattern: http://connect20.magentocommerce.com/{pool}/{name}/{version}/{name}-{version}.tgz
        return this.getKeyForDl(parsedKey) + '/' + extVersion + '/' + parsedKey.extension.name + '-' + extVersion + '.tgz';
      case '1.0':
        // pattern: http://connect.magentocommerce.com/{pool}/get/{name}-{version}.tgz
        return 'http://connect.magentocommerce.com/' + parsedKey.extension.pool + '/get/' + parsedKey.extension.name + '-' + extVersion + '.tgz';
      default:
        return false;
    }
  },

  isKey: function (key) {
    return this.parseKey(key);
  },

  getKey: function (key) {
    var parsedKey = this.parseKey(key);

    if (parsedKey !== false) {
      return this.getDownloadUrl(parsedKey);
    }

    return false;
  }
};
