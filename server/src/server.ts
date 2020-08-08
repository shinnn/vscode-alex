import {
    createConnection,
    ProposedFeatures,
    InitializeParams,
    DidChangeConfigurationNotification,
    TextDocumentSyncKind,
    DidSaveTextDocumentNotification,
    CodeAction,
    CodeActionKind,
    CodeActionParams,
    ExecuteCommandParams,
    NotificationType,
    DocumentFormattingParams,
    TextDocumentChangeEvent,
} from 'vscode-languageserver';
import { TextDocument, TextEdit } from 'vscode-languageserver-textdocument';

import { commands } from './linter';
import { provideQuickFixCodeActions } from './codeActions';

import { DocumentManager } from './DocumentManager';
const { performance } = require('perf_hooks');

// Active Document notifications to language server
interface ActiveDocumentNotificationParams {
    uri: string
}
namespace ActiveDocumentNotification {
    export const type = new NotificationType<ActiveDocumentNotificationParams, void>('alexLinter/activeDocument');
}

// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
let connection = createConnection(ProposedFeatures.all);

// Doc manager is a live instance managing the extension all along its execution
const docManager = new DocumentManager(connection);

let lastChangeConfigEventReceived: number;
const delayBeforeLintAgainAfterConfigUpdate = 1_500;

connection.onInitialize((params: InitializeParams) => {
    return {
        capabilities: {
            textDocumentSync: {
                change: TextDocumentSyncKind.Incremental,
                openClose: true,
                willSaveWaitUntil: true
            },
            documentFormattingProvider: true,
            executeCommandProvider: {
                commands: commands.map(command => command.command),
                dynamicRegistration: true
            },
            codeActionProvider: {
                codeActionKinds: [CodeActionKind.QuickFix]
            }
        }
    };
});

// Register workspace actions when server is initialized
connection.onInitialized(async () => {
    // Register for the client notifications we can use
    try {
        connection.client.register(DidChangeConfigurationNotification.type);
    } catch (e) {
        // If error, send notification to client
        return Promise.reject(new Error('VsCode Alex Linter "DidChangeConfigurationNotification" registration error: ' + e.message + '\n' + e.stack));
    }
    try {
        connection.client.register(DidSaveTextDocumentNotification.type);
    } catch (e) {
        // If error, send notification to client
        return Promise.reject(new Error('VsCode Alex Linter "DidSaveTextDocumentNotification" registration error: ' + e.message + '\n' + e.stack));
    }
});


// Lint again all opened documents in configuration changed 
// wait N seconds in case a new config change arrive, run just after the last one
connection.onDidChangeConfiguration(async (change) => {
    lastChangeConfigEventReceived = performance.now();
    setTimeout(async () => {
        if ((performance.now() - lastChangeConfigEventReceived) > delayBeforeLintAgainAfterConfigUpdate) {
            // Reset all cached document settings
            docManager.removeDocumentSettings('all');
            // Revalidate all open text documents
            for (const doc of docManager.documents.all()) {
                const settings = await docManager.getDocumentSettings(doc.uri);
                if (settings?.strategy === 'user') {
                    await resetDiagnostics(doc.uri);
                    continue;
                }
                await docManager.validateTextDocument(doc);
            };
        }
    }, delayBeforeLintAgainAfterConfigUpdate);

});

// Handle command requests from client
connection.onExecuteCommand(async (params: ExecuteCommandParams) => {
    await docManager.executeCommand(params);
});

// Handle formatting request from client
connection.onDocumentFormatting(async (params: DocumentFormattingParams): Promise<TextEdit[]> => {
    const { textDocument } = params;
    const settings = await docManager.getDocumentSettings(textDocument.uri);
    if (settings?.strategy === 'user') { return Promise.reject(); }
    const document = docManager.getDocumentFromUri(textDocument.uri);
    const textEdits: TextEdit[] = await docManager.formatTextDocument(document);
    // If document has been updated, lint again the sources
    if (textEdits.length > 0) {
        setTimeout(async () => {
            const documentUpdated = docManager.getDocumentFromUri(textDocument.uri);
            await docManager.validateTextDocument(documentUpdated);
        }, 500);
    }
    return textEdits;
});

// Manage to provide code actions (QuickFixes) when the user selects a part of the source code containing diagnostics
connection.onCodeAction(async (codeActionParams: CodeActionParams): Promise<CodeAction[]> => {
    if (!codeActionParams.context.diagnostics.length) {
        return [];
    }
    const document = docManager.getDocumentFromUri(codeActionParams.textDocument.uri);
    if (document == null) {
        return [];
    }
    const docQuickFixes: any = docManager.getDocQuickFixes(codeActionParams.textDocument.uri);
    if (docQuickFixes && Object.keys(docQuickFixes).length > 0) {
        return provideQuickFixCodeActions(document, codeActionParams, docQuickFixes);
    }
    return [];
});

// Notification from client that active window has changed
connection.onNotification(ActiveDocumentNotification.type, (params) => {
    docManager.setCurrentDocumentUri(params.uri);
});

// Lint text document on open
docManager.documents.onDidOpen(async (event) => {
    const textDocument: TextDocument = docManager.getDocumentFromUri(event.document.uri, true);
    const settings = await docManager.getDocumentSettings(textDocument.uri);
    if (settings?.strategy === 'user') { return; }
    await docManager.validateTextDocument(textDocument);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
docManager.documents.onDidChangeContent(async (change: TextDocumentChangeEvent<TextDocument>) => {
    const settings = await docManager.getDocumentSettings(change.document.uri);
    if (settings?.strategy === 'user') { return; }
    docManager.setCurrentDocumentUri(change.document.uri);
    if (settings?.strategy === 'onType') {
        await docManager.validateTextDocument(change.document);
    }
});

// Lint on save if it has been configured
docManager.documents.onDidSave(async event => {
    const textDocument: TextDocument = docManager.getDocumentFromUri(event.document.uri, true);
    const settings = await docManager.getDocumentSettings(textDocument.uri);
    if (settings?.strategy === 'user') {
        // TODO: Should the diagnostics be resetted when document is saved?
        // await resetDiagnostics(textDocument.uri);
        return;
    }
    if (settings.strategy === 'onSave') {
        await docManager.validateTextDocument(textDocument);
    }
});

// Only keep settings for open documents
docManager.documents.onDidClose(async event => { await resetDiagnostics(event.document.uri); });

async function resetDiagnostics(documentUri: string) {
    await docManager.resetDiagnostics(documentUri);
    docManager.removeDocumentSettings(documentUri);
}

// Make the text document manager listen on the connection
// for open, change and close text document events
docManager.documents.listen(connection);

// Listen on the connection
connection.listen();
