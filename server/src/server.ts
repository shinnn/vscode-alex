import {
    createConnection,
    Diagnostic,
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
    InitializeResult
} from 'vscode-languageserver';
// import { TextDocument as TD } from 'vscode-languageserver-textdocument';
import { TextDocument, TextEdit } from 'vscode-languageserver-textdocument';

import { commands } from './linter';
import { provideQuickFixCodeActions } from './codeActions';

import { DocumentManager } from './DocumentManager';
// const debug = require("debug")("vscode-groovy-lint");

// import { Position } from 'vscode';
// import { isNullOrUndefined } from 'util';

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
const delayBeforeLintAgainAfterConfigUpdate = 10000;

// Create a simple text document manager. The text document manager
// supports full document sync only
// let documents: TextDocuments<TextDocument> = new TextDocuments<TextDocument>(TD);

// let hasConfigurationCapability: boolean = false;
// let hasWorkspaceFolderCapability: boolean = false;
// let hasDiagnosticRelatedInformationCapability: boolean = false;
// let hasCodeActionLiteralsCapability: boolean = false;

connection.onInitialize((params: InitializeParams) => {
    console.log('alex-linter: initialize')
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
    console.log('alex-linter: initialized server');
});


// Lint again all opened documents in configuration changed 
// wait N seconds in case a new config change arrive, run just after the last one
connection.onDidChangeConfiguration(async (change) => {
    lastChangeConfigEventReceived = performance.now();
    setTimeout(async () => {
        if ((lastChangeConfigEventReceived - performance.now()) > delayBeforeLintAgainAfterConfigUpdate) {
            console.log(`change configuration event received: lint again all open documents`);
            // Reset all cached document settings
            docManager.removeDocumentSettings('all');
            // Revalidate all open text documents
            for (const doc of docManager.documents.all()) {
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
    console.log(`Formatting request received from client for ${ textDocument.uri }`);
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
    console.log(`Code action request received from client for ${ document.uri }`);
    const docQuickFixes: any = docManager.getDocQuickFixes(codeActionParams.textDocument.uri);
    if (docQuickFixes && Object.keys(docQuickFixes).length > 0) {
        return provideQuickFixCodeActions(document, codeActionParams, docQuickFixes);
    }
    return [];
});

// Notification from client that active window has changed
connection.onNotification(ActiveDocumentNotification.type, (params) => {
    console.log(`Active text editor has changed to ${ params.uri }`);
    docManager.setCurrentDocumentUri(params.uri);
});

// Lint groovy doc on open
docManager.documents.onDidOpen(async (event) => {
    console.log(`File open event received for ${ event.document.uri }`);
    const textDocument: TextDocument = docManager.getDocumentFromUri(event.document.uri, true);
    await docManager.validateTextDocument(textDocument);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
docManager.documents.onDidChangeContent(async (change: TextDocumentChangeEvent<TextDocument>) => {
    docManager.setCurrentDocumentUri(change.document.uri);
    const settings = await docManager.getDocumentSettings(change.document.uri);
    if (settings.strategy === 'onType') {
        await docManager.validateTextDocument(change.document);
    }
});

// Lint on save if it has been configured
docManager.documents.onDidSave(async event => {
    console.log(`save event received for ${ event.document.uri }`);
    const textDocument: TextDocument = docManager.getDocumentFromUri(event.document.uri, true);
    const settings = await docManager.getDocumentSettings(textDocument.uri);
    if (settings.strategy === 'onSave') {
        await docManager.validateTextDocument(textDocument);
    }
});

// Only keep settings for open documents
docManager.documents.onDidClose(async event => {
    console.log(`close event received for ${ event.document.uri }`);
    await docManager.resetDiagnostics(event.document.uri);
    docManager.removeDocumentSettings(event.document.uri);
});

// Make the text document manager listen on the connection
// for open, change and close text document events
docManager.documents.listen(connection);

// Listen on the connection
connection.listen();
