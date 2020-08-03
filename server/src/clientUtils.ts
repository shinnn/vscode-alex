import { TextDocument, TextEdit } from 'vscode-languageserver-textdocument';
import { TextDocumentEdit, WorkspaceEdit } from 'vscode-languageserver';
import { DocumentManager } from './DocumentManager';
import { Diagnostic } from 'vscode-languageserver';

// Apply updated source into the client TextDocument
export async function applyTextDocumentEditOnWorkspace(docManager: DocumentManager, textDocument: TextDocument, diagnostic: Diagnostic, edits: string) {
    textDocument = docManager.getUpToDateTextDocument(textDocument);
    const textDocEdit: TextDocumentEdit = createTextDocumentEdit(textDocument, diagnostic, edits);
    const applyWorkspaceEdits: WorkspaceEdit = {
        documentChanges: [textDocEdit]
    };
    const applyEditResult = await docManager.connection.workspace.applyEdit(applyWorkspaceEdits);
    console.debug(`Updated ${ textDocument.uri } using WorkspaceEdit (${ JSON.stringify(applyEditResult) })`);
}

// Create a TextDocumentEdit that will be applied on client workspace
export function createTextDocumentEdit(textDocument: TextDocument, diagnostic: Diagnostic, edits: string): TextDocumentEdit {
    const textEdit: TextEdit = createTextEdit(diagnostic, edits);
    const textDocEdit: TextDocumentEdit = TextDocumentEdit.create({ uri: textDocument.uri, version: textDocument.version }, [textEdit]);
    return textDocEdit;
}

export function createTextEdit(diagnostic: Diagnostic, edits: string): TextEdit {
    let textEdit: TextEdit = {
        range: diagnostic.range,
        newText: edits
    };
    return textEdit;
}

// Check if we are in test mode
export function isTest() {
    return (process.env.npm_lifecycle_event && process.env.npm_lifecycle_event === 'test') ||
        (process.env.NYC_COVERAGE && process.env.NYC_COVERAGE === 'activated');
}
