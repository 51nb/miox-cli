var util = require('./util');
var dialog = require('inquirer');
var fs = require('fs');
var path = require('path');
var request = require('request');
var progress = require('request-progress');
var ora = require('ora');
var cliSpinners = require('cli-spinners');
var chalk = require('chalk');
var unzip = require('unzip');
var log = console.log;

var asks = [
  {
    type: 'input',
    name: 'dir',
    message: 'What is the name?',
    validate: function(value) {
      if (!value) {
        return new Error('project name can not be empty!');
      }
      var dir = path.resolve(process.cwd(), value);
      if (fs.existsSync(dir)) {
        return new Error(value + ' is exists!');
      }
      return true;
    }
  },
  {
    type: 'list',
    name: 'template',
    message: 'Which template do you choose?',
    default: null,
    choices: util.packageNames()
  }
];

module.exports = function() {
  dialog.prompt(asks).then(function(answers) {
    var template = util.findPackage(answers.template);
    var githubURI = util.packageZipURI(template);
    var name = template + '.zip';
    var file = path.resolve(process.cwd(), name);
    download(githubURI, name, function() {
      fs.createReadStream(file)
      .pipe(unzip.Extract({ path: process.cwd() }))
      .on('close', function() {
        var source = path.resolve(process.cwd(), template + '-master');
        var target = path.resolve(process.cwd(), answers.dir);
        fs.renameSync(source, answers.dir);
        fs.unlinkSync(file);
        askToInstall(target);
      });
    });
  })
}

function download(githubURI, name, callback) {
  var spinner = ora(cliSpinners.dots).start();
  progress(request(githubURI))
  .on('progress', function (state) {
    spinner.color = 'yellow';
    spinner.text = 'Downloading ... ' + 
      parseInt(state.percent * 100) + '% ' + 
      '[' + parseInt(state.speed) + 'B/s] ' + 
      '<' + state.size.transferred + '/' + state.size.total + '> ' + 
      '{' + state.time.elapsed + 's/' + state.time.remaining + 's}';

      // The state is an object that looks like this: 
      // { 
      //     percent: 0.5,               // Overall percent (between 0 to 1) 
      //     speed: 554732,              // The download speed in bytes/sec 
      //     size: { 
      //         total: 90044871,        // The total payload size in bytes 
      //         transferred: 27610959   // The transferred payload size in bytes 
      //     }, 
      //     time: { 
      //         elapsed: 36.235,        // The total elapsed seconds since the start (3 decimals) 
      //         remaining: 81.403       // The remaining seconds to finish (3 decimals) 
      //     } 
      // } 
  })
  .on('error', function (err) {
    log(chalk.red(err.message));
    spinner.stop();
    process.exit(1);
  })
  .on('end', function () {
    spinner.stop();
    callback();
  })
  .pipe(fs.createWriteStream(name));
}

function askToInstall(dir) {
  dialog.prompt({
    type: 'confirm',
    name: 'allowInstall',
    message: 'Do you want to install dependencies immediately?',
    default: true
  }).then(function(answers) {
    if (!answers.allowInstall) {
      log(chalk.green(':', 'Please install dependencies by yourself!'));
      log(chalk.cyan(':', 'All done!'));
      log();
      return process.exit(0);
    }
    log('...', 'Installing dependencies from', dir);
    util.exec('npm install', dir, false, function() {
      log();
      log(chalk.cyan(':', 'All done!'));
      log();
      process.exit(0);
    })
  })
}