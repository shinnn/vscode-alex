'use strict';

const path = require('path');

const langClient = require('vscode-languageclient');
const LanguageClient = langClient.LanguageClient;
const SettingMonitor = langClient.SettingMonitor;

exports.activate = function activateAlex(context) {
  const serverModule = path.join(__dirname, 'server.js');

  const client = new LanguageClient('alex', {
    run: {
      module: serverModule
    },
    debug: {
      module: serverModule,
      options: {
        execArgv: ['--nolazy', '--debug=6004']
      }
    }
  }, {
    documentSelector: ['plaintext', 'markdown'],
    synchronize: {configurationSection: 'alex'}
  });

  context.subscriptions.push(new SettingMonitor(client, 'alex.enable').start());
};
