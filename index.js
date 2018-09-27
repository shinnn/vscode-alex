'use strict';

const path = require('path');

const {LanguageClient, SettingMonitor} = require('vscode-languageclient');

exports.activate = ({subscriptions}) => {
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

	subscriptions.push(new SettingMonitor(client, 'alex.enable').start());
};
