var fs = require('fs');
var path = require('path');
var chalk = require('chalk');
var axios = require('axios');
var dialog = require('inquirer');
var child = require('child_process');
var util = require('./util');
var thisPkg = require('../package.json');
var log = console.log;

var MIOX_PACKAGE_MODULES = [
  "miox", 
  "miox-css", 
  "miox-compose", 
  "miox-convert", 
  "miox-animation", 
  "miox-koa-vue2x-server-render", 
  "miox-router", 
  "miox-vue2x", 
  "miox-vue2x-component-classify", 
  "miox-vue2x-webpack-config", 
  "miox-vue2x-container", 
  "miox-react"
];

module.exports = function (modules, options) {
  if (modules.length === 0 && !options.project) {
    util.getRemotePackageVersion('miox-cli', function(v) {
      if (v !== thisPkg.version) {
        log('-', chalk.red('Two versions is not matched!'));
        dialog.prompt({
          type: 'confirm',
          name: 'allowUpdate',
          message: 'Did you want to update v' + thisPkg.version + '(local)' + ' to v' + v + '(latest)',
          default: true
        }).then(function(answers) {
          if (answers.allowUpdate) {
            util.exec('npm install -g miox-cli@' + v, null, false, function() {
              log(chalk.cyan('Update Miox-cli success!'));
              process.exit(0);
            });
          }
        })
      } else {
        log(chalk.cyan('miox-cli is up to date!'));
      }
    });
  } else {
    var miox_packages = modules;

    if (!miox_packages.length && options.project) {
      miox_packages = getLocalMioxPackages(process.cwd());
    }

    if (!miox_packages.length) {
      log(chalk.gray('Sorry, no `miox` module packages!'));
      return process.exit(0);
    }

    if (!~miox_packages.indexOf('miox')) {
      log(
        '\n\tMiss %s package' +
        '\n\tTo install it' +
        '\n\tUsing `%s %s %s %s`' + 
        '\n',
        chalk.red.bold('`miox`'),
        chalk.red('npm'),
        chalk.cyan('install'),
        chalk.green.bold('miox'),
        chalk.yellow('--save')
      );
      return process.exit(1);
    }

    if (options.latest) {
      util.getRemotePackageVersion('miox', function(v) {
        compare(v, miox_packages, options.silent);
      });
    } else {
      compare(getLocalPackageVersion('miox'), miox_packages, options.silent);
    }
  }
}

function compare(version, packages, silent) {
  var result = [];
  log('>', chalk.cyan('Version:'), chalk.red('v' + version));
  packages.forEach(function(pkg) {
    var v = getLocalPackageVersion(pkg);
    if (v === version) {
      log(chalk.green(' ', '✔'), chalk.magenta(pkg), chalk.yellow('v' + v));
    } else {
      result.push(pkg);
      log(chalk.red(' ', '✘'), chalk.magenta(pkg), chalk.yellow('v' + v));
    }
  });

  if (result.length) {
    dialog.prompt({
      type: 'checkbox',
      name: 'packages',
      message: 'Which packages need been updated?',
      default: [],
      choices: result,
      pageSize: 10
    }).then(function (answers) {
      if (!answers.packages.length) {
        log(chalk.magenta('You can update packages by yourself!'));
        return process.exit(0);
      }
      log(':', chalk.blue('Updating packages ...'));
      var cmd = 'npm install ' + answers.packages.map(function(pkg) {
        return pkg + '@' + version;
      }).join(' ');

      log('>', 'CWD:', process.cwd());
      log('>', 'RUN:', chalk.gray(cmd));
      log('\n');

      util.exec(cmd, process.cwd(), silent, function() {
        log(chalk.cyan('All packages has been updated.'));
        process.exit(0);
      });
    });
  } else {
    log(chalk.green('No packages need been updated.'));
    process.exit(0);
  }
}

function getLocalMioxPackages(dir) {
  return fs.readdirSync(path.resolve(dir, 'node_modules'))
    .filter(function(name) {
      return !!~MIOX_PACKAGE_MODULES.indexOf(name);
    });
}

function getLocalPackageVersion(name) {
  return require(path.resolve(process.cwd(), 'node_modules', name, 'package.json')).version;
}