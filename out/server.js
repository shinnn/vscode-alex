'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageserver_1 = require("vscode-languageserver");
const alexVSCode = require("alex-vscode");
// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
let connection = vscode_languageserver_1.createConnection(vscode_languageserver_1.ProposedFeatures.all);
// Create a simple text document manager. The text document manager
// supports full document sync only
let documents = new vscode_languageserver_1.TextDocuments(null);
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
            textDocumentSync: vscode_languageserver_1.TextDocumentSyncKind.Incremental
        }
    };
});
connection.onDidChangeConfiguration(() => validateAll());
connection.onDidChangeWatchedFiles(() => validateAll());
documents.onDidChangeContent(event => validate(event.document));
documents.listen(connection);
connection.listen();
//# sourceMappingURL=server.js.map