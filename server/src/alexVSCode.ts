/*!
 * alex-vscode | MIT (c) Shinnosuke Watanabe
 * https://github.com/shinnn/alex-vscode
*/
'use strict';

import { TextDocument } from "vscode-languageserver";
const alex = require('alex');
const isMdPath = require('is-md');

export interface AlexSettings {
    noBinary: boolean;
    profanitySureness: number;
    allow: string[];
    deny: string[];
}

export class AlexVSCode {
    private _text: string = '';
    get text() { return this._text; }
    messages: any;

    private _settings: AlexSettings;
    get settings(): AlexSettings { return this._settings; }

    constructor (currentSettings: AlexSettings) {
        const prof = currentSettings.profanitySureness as unknown as string;
        this._settings = {
            ...currentSettings,
            profanitySureness: ['unlikely', 'maybe', 'likely'].indexOf(prof)
        };
    }

    isTextDocument(textDocument: TextDocument) {
        if (
            textDocument !== null &&
            typeof textDocument === 'object' &&
            typeof textDocument.getText === 'function'
        ) {
            return true;
        }

        return false;
    }

    isMarkdown(textDocument: TextDocument) {
        if (textDocument.languageId) {
            return textDocument.languageId === 'markdown';
        }

        return isMdPath(String(textDocument.uri));
    }

    run(textDocument: TextDocument) {
        if (!this.isTextDocument(textDocument)) {
            throw new TypeError(
                String(textDocument) +
                ' is not a textDocument. Expected a VS Code\'s textDocument.'
            );
        }

        this._text = textDocument.getText();
        let messages = (this.isMarkdown(textDocument) ? alex : alex.text)(textDocument.getText(), this._settings).messages;
        messages = messages.map((message: any) => ({
            message: this.parseMessage(message.reason),
            // https://github.com/Microsoft/vscode-languageserver-node/blob/v2.6.2/types/src/main.ts#L130-L147
            severity: message.fatal === true ? 1 : 2,
            range: {
                start: {
                    line: (message.location.start.line || message.line || 1) - 1,
                    character: (message.location.start.column || message.column || 1) - 1
                },
                end: {
                    line: (message.location.end.line || message.line || 1) - 1,
                    character: (message.location.end.column || message.column || 1) - 1
                }
            },
            resolved: false
        }));
        this.messages = messages;
        return Promise.resolve([]);
    };

    private parseMessage(message: string): { result: string, replace: string[] } {
        const results = message?.split(', use');
        const replace = this.getOdd(results?.[1]?.split('`'));
        return { result: results?.[0], replace }
    }

    /**
     * @param candid Array of results
     * @return Returns an array where index 0 = array of even ones, and index 1 = array of odd ones
    */
    private getOdd(candid: string[]): string[] {
        var oddOnes: string[] = [];
        for (var i = 0; i < candid?.length; i++) {
            (i % 2 == 0 ? [] : oddOnes).push(candid[i]);
        }
        return oddOnes;
    }
}
