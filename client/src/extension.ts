import * as path from 'path';
import { workspace, ExtensionContext } from 'vscode';
import * as vscode from 'vscode';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind
} from 'vscode-languageclient';

const DIAGNOSTICS_COLLECTION_NAME = 'AlexLinter';
let diagnosticsCollection: vscode.DiagnosticCollection;

let client: LanguageClient;

export function activate(context: ExtensionContext) {
    // Create diagnostics collection
    diagnosticsCollection = vscode.languages.createDiagnosticCollection(DIAGNOSTICS_COLLECTION_NAME);

    ///////////////////////////////////////////////
    /////////////// Server + client ///////////////
    ///////////////////////////////////////////////

    // The server is implemented in node
    let serverModule = context.asAbsolutePath(path.join('server', 'out', 'server.js'));
    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    let serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
            options: {
                execArgv: ['--nolazy', '--inspect=6009'],
                env: { "DEBUG": "vscode-alex-linter,npm-alex-linter" }
            }
        }
    };
    // Options to control the language client
    let clientOptions: LanguageClientOptions = {
        // Register the server for plain text, markdown and latex documents
        documentSelector: [
            { scheme: 'file', language: 'plaintext' },
            { scheme: 'file', language: 'markdown' },
            { scheme: 'file', language: 'latex' }
        ],
        diagnosticCollectionName: DIAGNOSTICS_COLLECTION_NAME,
        progressOnInitialization: true,
        synchronize: {
            // Notify the server about file changes to '.clientrc files contained in the workspace
            fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
        }
    };
    // Create the language client and start the client.
    client = new LanguageClient(
        'alexLinter',
        'Alex Linter',
        serverOptions,
        clientOptions
    );

    // Start the client. This will also launch the server
    context.subscriptions.push(
        client.start(),
    );
}

// Stop client when extension is deactivated
export function deactivate(): Thenable<void> {
    return client.stop();
}
