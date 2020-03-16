'use strict';

import {
    createConnection,
    ProposedFeatures,
    TextDocuments,
    TextDocumentSyncKind
} from 'vscode-languageserver';
import * as alexVSCode from 'alex-vscode';

// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
let connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager. The text document manager
// supports full document sync only
let documents: TextDocuments<string> = new TextDocuments<string>(null);

function validate(document) {
    const results = alexVSCode(document);

    if (results.length === 0) {
        return;
    }

    connection.sendDiagnostics({
        uri: document.uri,
        diagnostics: results.map(result => {
            result.message = 'alex: ' + result.message;
            return result;
        })
    });
}

function validateAll() {
    return documents.all().map(document => validate(document));
}

connection.onInitialize(() => {
    validateAll();

    return {
        capabilities: {
            // Enable incremental document sync
            textDocumentSync: TextDocumentSyncKind.Incremental
        }
    };
});
connection.onDidChangeConfiguration(() => validateAll());
connection.onDidChangeWatchedFiles(() => validateAll());

documents.onDidChangeContent(event => validate(event.document));
documents.listen(connection);

connection.listen();
