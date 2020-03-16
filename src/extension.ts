'use strict';

import {
    LanguageClient,
    SettingMonitor
} from 'vscode-languageclient';
import * as path from 'path';

exports.activate = function activateAlex(context) {
    const serverModule = path.join(__dirname, 'server.ts');

    const client = new LanguageClient('alex', {
        run: {
            module: serverModule
        },
        debug: {
            module: serverModule,
            options: {
                execArgv: ['--nolazy', '--inspect=6004']
            }
        }
    }, {
        documentSelector: ['plaintext', 'markdown'],
        synchronize: { configurationSection: 'alex' }
    });

    context.subscriptions.push(new SettingMonitor(client, 'alex.enable').start());
};
