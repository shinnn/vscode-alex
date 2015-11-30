'use strict';

const langServer = require('vscode-languageserver');
const alexVSCode = require('alex-vscode');

const connection = langServer.createConnection(process.stdin, process.stdout);
const documents = new langServer.TextDocuments();

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
      textDocumentSync: documents.syncKind
    }
  };
});
connection.onDidChangeConfiguration(() => validateAll());
connection.onDidChangeWatchedFiles(() => validateAll());

documents.onDidChangeContent(event => validate(event.document));
documents.listen(connection);

connection.listen();
