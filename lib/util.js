var chalk = require('chalk');
var axios = require('axios');
var child = require('child_process');
var log = console.log;

exports.packageZip = {
  "miox-template-vue2x-web": "Vue.2x.WEB project template",
  "miox-template-vue2x-ssr-koa": "Vue.2x.SSR project template",
  "miox-template-react-web": "React.WEB project template"
};

exports.getRemotePackageVersion = function getRemotePackageVersion(name, callback) {
  axios.get('http://registry.npmjs.org/' + name + '/latest').then(function(res) {
    callback(res.data.version);
  })
}

exports.exec = function exec(cmd, cwd, silent, callback) {
  var options = {};
  if (cwd) {
    options.cwd = cwd;
  }
  var progress = child.exec(cmd, options, function(error) {
    if (error) {
      log(chalk.red(error));
      return process.exit(1);
    }

    callback();
  });

  if (!silent) {
    progress.stdout.on('data', function(data) {
      log(chalk.gray(data));
    });

    progress.stderr.on('data', function(data) {
      log(chalk.red(data));
    });
  }
}

exports.packageZipURI = function packageZipURI(name) {
  return 'https://codeload.github.com/51nb/' + name + '/zip/master';
}

exports.packageNames = function packageNames() {
  const result = [];
  for (var i in exports.packageZip ) {
    result.push(exports.packageZip[i]);
  }
  return result;
}

exports.findPackage = function findPackage(name) {
  for (var i in exports.packageZip ) {
    if (exports.packageZip[i] === name) {
      return i;
    }
  }
}