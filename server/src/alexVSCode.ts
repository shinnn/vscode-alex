/*!
 * alex-vscode | MIT (c) Shinnosuke Watanabe
 * https://github.com/shinnn/alex-vscode
*/
'use strict';

import { TextDocument } from "vscode-languageserver";
const alex = require('alex');
const isMdPath = require('is-md');

function isTextDocument(textDocument: TextDocument) {
  if (
    textDocument !== null &&
    typeof textDocument === 'object' &&
    typeof textDocument.getText === 'function'
  ) {
    return true;
  }

  return false;
}

function isMarkdown(textDocument: TextDocument) {
  if (textDocument.languageId) {
    return textDocument.languageId === 'markdown';
  }

  return isMdPath(String(textDocument.uri));
}

export function alexVSCode(textDocument: TextDocument) {
  if (!isTextDocument(textDocument)) {
    throw new TypeError(
      String(textDocument) +
      ' is not a textDocument. Expected a VS Code\'s textDocument.'
    );
  }

  let messages = (isMarkdown(textDocument) ? alex : alex.text)(textDocument.getText()).messages;
  messages = messages.map((message: any) => ({
    message: message.reason,
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
    }
  }));
  return messages;
};
