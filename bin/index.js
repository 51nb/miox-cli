#!/usr/bin/env node

'use strict';

var app = require('cmdu');
var packageData = require('../package.json');
var env = process.env;

app.version = packageData.version;
app.language = env.language || 'zh-CN';
app.command('create').describe('创建一个新项目').action('../lib/create');

app
  .command('version [...modules]')
  .describe('Miox-cli版本检测')
  .describe('modules', '检测某个模块的版本')
  .option('-p, --project', '检测本地Miox包的版本是否一致')
  .option('-l, --latest', '检测本地使用Miox包的版本是否最新')
  .option('-s, --silent', '是否静默输出')
  .action('../lib/version');

app.listen();