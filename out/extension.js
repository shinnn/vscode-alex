'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageclient_1 = require("vscode-languageclient");
const path = require("path");
exports.activate = function activateAlex(context) {
    const serverModule = path.join(__dirname, 'server.ts');
    const client = new vscode_languageclient_1.LanguageClient('alex', {
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
    context.subscriptions.push(new vscode_languageclient_1.SettingMonitor(client, 'alex.enable').start());
};
//# sourceMappingURL=extension.js.map