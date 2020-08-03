import {
    CodeAction,
    CodeActionParams,
    CodeActionKind,
    TextDocument,
    Diagnostic,
    NotificationType,
} from 'vscode-languageserver';
import { DocumentManager } from './DocumentManager';
import { applyTextDocumentEditOnWorkspace } from './clientUtils';

const lintAgainAfterQuickFix: boolean = true; // Lint after fix is performed by npm-groovy-lint fixer

// Status notifications
interface StatusParams {
    state: string;
    documents: [
        {
            documentUri: string,
            updatedSource?: string
        }];
    lastFileName?: string
    lastLintTimeMs?: number
}
namespace StatusNotification {
    export const type = new NotificationType<StatusParams, void>('alexLinter/status');
}

/**
 * Provide quickfixes for a piece of code *
 * @export
 * @param {TextDocument} textDocument
 * @param {CodeActionParams} parms
 * @returns {CodeAction[]}
 */
export function provideQuickFixCodeActions(textDocument: TextDocument, codeActionParams: CodeActionParams, docQuickFixes: any): CodeAction[] {
    const diagnostics = codeActionParams.context.diagnostics;
    if (diagnostics === null || diagnostics === undefined || diagnostics.length === 0) {
        return [];
    }
    const quickFixCodeActions: CodeAction[] = [];
    for (const diagnostic of codeActionParams.context.diagnostics) {
        // Get corresponding QuickFix if existing and convert it as QuickAction
        const diagCode: string = diagnostic.code + '';
        if (docQuickFixes && docQuickFixes[diagCode]) {
            for (const quickFix of docQuickFixes[diagCode]) {
                const codeActions = createQuickFixCodeActions(diagnostic, quickFix, textDocument.uri);
                quickFixCodeActions.push(...codeActions);
            }
        }
    }
    console.log(`Provided ${ quickFixCodeActions.length } codeActions for ${ textDocument.uri }`);
    return quickFixCodeActions;

}

// Create QuickFix codeActions for diagnostic
function createQuickFixCodeActions(diagnostic: Diagnostic, quickFix: any, textDocumentUri: string): CodeAction[] {
    const codeActions: CodeAction[] = [];

    // Quick fix only this error
    const quickFixAction: CodeAction = {
        title: 'Fix: ' + quickFix.label,
        kind: CodeActionKind.QuickFix,
        command: {
            command: 'alexLinter.quickFix',
            title: 'Fix: ' + quickFix.label,
            arguments: [diagnostic, textDocumentUri, quickFix.value],
        },
        diagnostics: [diagnostic],
        isPreferred: codeActions.length === 0
    };
    codeActions.push(quickFixAction);

    return codeActions;
}

// Apply quick fixes
export async function applyQuickFixes(diagnostic: Diagnostic, textDocumentUri: string, edits: string, docManager: DocumentManager) {
    // Sometimes it comes there whereas it shouldn't ... let's avoid a crash
    if (diagnostic == null) {
        console.warn('Warning: no diagnostics set');
        return;
    }
    if (edits === null || edits === '') {
        console.warn('Warning: no edits set');
        return;
    }

    const textDocument: TextDocument = docManager.getDocumentFromUri(textDocumentUri);
    const docLinter = docManager.getDocLinter(textDocument.uri);
    console.log(`Start fixing ${ textDocument.uri }`);
    await docManager.connection.sendNotification(StatusNotification.type, {
        state: 'alexLinter.applyQuickFix',
        documents: [{ documentUri: textDocument.uri }],
        lastFileName: textDocument.uri
    });

    await applyTextDocumentEditOnWorkspace(docManager, textDocument, diagnostic, edits);
    docManager.validateTextDocument(textDocument, { force: true });
    console.log(`End fixing ${ textDocument.uri }`);
}

// Quick fix in the whole file
export async function applyQuickFixesInFile(diagnostics: Diagnostic[], textDocumentUri: string, docManager: DocumentManager) {
    const textDocument: TextDocument = docManager.getDocumentFromUri(textDocumentUri);
    const fixRules = (diagnostics[0].code as string).split('-')[0];
    console.log(`Request apply QuickFixes in file for all ${ fixRules } error in ${ textDocumentUri }`);
    await docManager.validateTextDocument(textDocument, { fix: true, fixrules: fixRules });
}
