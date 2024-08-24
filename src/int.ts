import * as vscode from 'vscode';
import * as path from 'path';
import { getAllCommands, getBasicCommands, getDevCommands } from './commands';

const diagnostics = vscode.languages.createDiagnosticCollection('vcpk');

export default function init(context: vscode.ExtensionContext) {
    const commandsbasics = getBasicCommands();
    const devCommands = getDevCommands();

    context.subscriptions.push(diagnostics);

    const provider = getProvider(commandsbasics, devCommands);

    // Adiciona os eventos para verificar e atualizar diagnósticos
    vscode.workspace.onDidOpenTextDocument(document => lexicalAnalyse(document));
    vscode.workspace.onDidSaveTextDocument(document => lexicalAnalyse(document));
    vscode.workspace.onDidChangeTextDocument(event => lexicalAnalyse(event.document));

    context.subscriptions.push(provider);

    // Adiciona uma verificação inicial para documentos já abertos na inicialização
    vscode.workspace.textDocuments.forEach(document => lexicalAnalyse(document));
}

function checkIfInBuildSection(document: vscode.TextDocument, position: vscode.Position): boolean {
    const linesToCheck = Math.min(position.line, 10);
    for (let i = 0; i < linesToCheck; i++) {
        const lineText = document.lineAt(position.line - i).text.trim();
        if (lineText.startsWith('%prebuildsource') ||
            lineText.startsWith('%buildsource') ||
            lineText.startsWith('%install') ||
            lineText.startsWith('%debuginstall')) {
            return true;
        }
    }
    return false;
}

function checkIfInBuildSourceSection(document: vscode.TextDocument, position: vscode.Position): boolean {
    const linesToCheck = Math.min(position.line, 10);
    for (let i = 0; i < linesToCheck; i++) {
        const lineText = document.lineAt(position.line - i).text.trim();
        if (lineText.startsWith('%buildsource')) {
            return true;
        }
    }
    return false;
}

function getProvider(commandsbasics: string[], devCommands: string[]) {
    return vscode.languages.registerCompletionItemProvider('vcpk', {
        provideCompletionItems(document, position) {
            const linePrefix = document.lineAt(position).text.substr(0, position.character);

            const isInBuildSection = checkIfInBuildSection(document, position);
            const isInBuildSourceSection = checkIfInBuildSourceSection(document, position);

            if (isInBuildSourceSection) {
                const commandCompletions = devCommands.map(command =>
                    new vscode.CompletionItem(command, vscode.CompletionItemKind.Text)
                );
                return commandCompletions;
            }

            if (isInBuildSection) {
                const commandCompletions = commandsbasics.map(command =>
                    new vscode.CompletionItem(command, vscode.CompletionItemKind.Text)
                );
                return commandCompletions;
            }

            const generalCompletions = [
                new vscode.CompletionItem('Name', vscode.CompletionItemKind.Keyword),
                new vscode.CompletionItem('Version', vscode.CompletionItemKind.Keyword),
                new vscode.CompletionItem('Author', vscode.CompletionItemKind.Keyword),
                new vscode.CompletionItem('Description', vscode.CompletionItemKind.Keyword),
                new vscode.CompletionItem('Architecture', vscode.CompletionItemKind.Keyword),
                new vscode.CompletionItem('Require', vscode.CompletionItemKind.Keyword),
                new vscode.CompletionItem('Licence', vscode.CompletionItemKind.Keyword),
                new vscode.CompletionItem('SourceType', vscode.CompletionItemKind.Keyword),
                new vscode.CompletionItem('installDir', vscode.CompletionItemKind.Keyword),
                new vscode.CompletionItem('installDebugDir', vscode.CompletionItemKind.Keyword),
                new vscode.CompletionItem('%prebuildsource', vscode.CompletionItemKind.Snippet),
                new vscode.CompletionItem('%buildsource', vscode.CompletionItemKind.Snippet),
                new vscode.CompletionItem('%install', vscode.CompletionItemKind.Snippet),
                new vscode.CompletionItem('%files', vscode.CompletionItemKind.Snippet),
                new vscode.CompletionItem('%debuginstall', vscode.CompletionItemKind.Snippet),
                new vscode.CompletionItem('$current_env', vscode.CompletionItemKind.Variable),
                new vscode.CompletionItem('$debug', vscode.CompletionItemKind.Variable),
                new vscode.CompletionItem('$sources', vscode.CompletionItemKind.Variable),
                new vscode.CompletionItem('$files', vscode.CompletionItemKind.Variable),
                 // Snippet para o bloco de código ao digitar 'vcpk'
                 {
                    label: 'vcpk',
                    kind: vscode.CompletionItemKind.Snippet,
                    insertText: new vscode.SnippetString(
                        `Name: "\${1:Name}"\nVersion: "\${2:Version}"\nAuthor: "\${3:Author}"\nRequire: "\${4:Require}"\nDescription: "\${5:Description}"\nArchitecture: "\${6:Architecture}"\nLicence: "\${6:GPL}"\nSourceType: "\${7:SourceType}"\ninstallDir: "\${8:installDir}"\ninstallDebugDir: "\${9:installDebugDir}"\n\n%prebuildsource\n\n%buildsource\n\n%install\n\n%debuginstall\n\n%files`
                    ),
                    documentation: new vscode.MarkdownString("Insere o bloco de código padrão para um arquivo `.vcpk`.")
                }
            ];

            return generalCompletions;
        }
    });
}



function isInSection(document: vscode.TextDocument, line: number, section: string): boolean {
    for (let i = line; i >= 0; i--) {
        const lineText = document.lineAt(i).text.trim();

        if (lineText.startsWith(section)) {
            return true;
        } else if (lineText.startsWith('%') && lineText !== section) {
            return false;
        }
    }
    return false;
}

function containsForbiddenCommands(lineText: string): string | null {
    const forbiddenCommands = getDevCommands();
    for (const command of forbiddenCommands) {
        if (lineText.includes(command)) {
            return command;
        }
    }
    return null;
}

function lexicalAnalyse(document: vscode.TextDocument) {

    const fileExtension = path.extname(document.uri.fsPath);
    if (fileExtension !== '.vcpk') {
        return; // Ignorar documentos que não têm a extensão .vcpk
    }

    const diagnosticsArray: vscode.Diagnostic[] = [];

    for (let i = 0; i < document.lineCount; i++) {
        const lineText = document.lineAt(i).text;
        let trimmedLineText = lineText.trim();

        // Ignorar linhas que são comentários ou seções
        if (trimmedLineText.startsWith('#') || trimmedLineText.startsWith('%')) {
            continue;
        }

        if(trimmedLineText === "Name:" || trimmedLineText === "Version:" || trimmedLineText === "Author:" || trimmedLineText === "Description:" || trimmedLineText === "Architecture:" || trimmedLineText === "Licence:" || trimmedLineText === "SourceType:" || trimmedLineText === "installDir:" || trimmedLineText === "installDebugDir:"){
            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(new vscode.Position(i, 0), new vscode.Position(i, lineText.length)),
                `Erro de sintaxe na linha ${i + 1}: O valor após o ':' deve ser definido e estar entre aspas.`,
                vscode.DiagnosticSeverity.Error
            );
            diagnosticsArray.push(diagnostic);
        }

        // Verificação de valores após `:` para propriedades
        if (/^[a-zA-Z0-9_]+: /.test(trimmedLineText)) {
            // Extrair o valor após o `:`
            const value = trimmedLineText.split(':')[1]?.trim();

            if (value === undefined || value === null || value === "" || 
                !/^".*"$/.test(value) && !/^'.*'$/.test(value)) {
                // Se o valor não está definido, é nulo, vazio ou não está entre aspas
                const diagnostic = new vscode.Diagnostic(
                    new vscode.Range(new vscode.Position(i, 0), new vscode.Position(i, lineText.length)),
                    `Erro de sintaxe na linha ${i + 1}: O valor após o ':' deve ser definido e estar entre aspas.`,
                    vscode.DiagnosticSeverity.Error
                );
                diagnosticsArray.push(diagnostic);
            }


            if (value && !/^".*"$/.test(value) && !/^'.*'$/.test(value)) {
                
                // Se o valor não está entre aspas
                const diagnostic = new vscode.Diagnostic(
                    new vscode.Range(new vscode.Position(i, 0), new vscode.Position(i, lineText.length)),
                    `Erro de sintaxe na linha ${i + 1}: O valor após o ':' deve estar entre aspas.`,
                    vscode.DiagnosticSeverity.Error
                );
                diagnosticsArray.push(diagnostic);
            }
            continue; // Pular verificação adicional para essa linha
        }

        // Verificação se a linha está nas seções específicas
        const isInSpecialSection = isInSection(document, i, "%prebuildsource") ||
                                   isInSection(document, i, "%buildsource") ||
                                   isInSection(document, i, "%install") ||
                                   isInSection(document, i, "%debuginstall") ||
                                   isInSection(document, i, "%files");

        if (isInSpecialSection) {
           //const commands = getDevCommands().concat(getBasiicCommands());
           const commands = getAllCommands();

            for (const command of commands) {
                if (trimmedLineText.startsWith(command["command"])) {
                    // Verificar se o comando é seguido por aspas
                    const remainingText = trimmedLineText.substring(command["command"].length).trim();
                    if (!/^".*"$/.test(remainingText) && !/^'.*'$/.test(remainingText)) {
                        if(!isInSection(document, i, '%buildsource') && command['type'] == "Dev"){
                            break
                        }else {
                            const diagnostic = new vscode.Diagnostic(
                                new vscode.Range(new vscode.Position(i, 0), new vscode.Position(i, lineText.length)),
                                `Erro de sintaxe na linha ${i + 1}: O comando '${command["command"]}' deve ser seguido por uma string com aspas duplas ou simples. EX: ${command["command"]} "uma string"`,
                                vscode.DiagnosticSeverity.Error
                            );
                            diagnosticsArray.push(diagnostic);
                            break; // Para evitar diagnósticos repetidos para o mesmo comando
                        }
                    }
                }
            }
        }

        // Outras verificações permanecem
        if (checkIfLineStartsWithBasicCommand(trimmedLineText)) {
            continue;
        }

        const forbiddenCommand = containsForbiddenCommands(trimmedLineText);

        if (isInSection(document, i, "%prebuildsource") || 
            isInSection(document, i, "%install") || 
            isInSection(document, i, "%debuginstall") || 
            isInSection(document, i, "%files")) {  
            
            if (forbiddenCommand !== null) {
                const diagnostic = new vscode.Diagnostic(
                    new vscode.Range(new vscode.Position(i, lineText.indexOf(forbiddenCommand)), new vscode.Position(i, lineText.length)),
                    `Erro de sintaxe na linha ${i + 1}: '${forbiddenCommand}' deve ser utilizado na seção %buildsource.`,
                    vscode.DiagnosticSeverity.Error
                );
                diagnosticsArray.push(diagnostic);
            }
        }
    }

    diagnostics.set(document.uri, diagnosticsArray);
}




function checkIfLineStartsWithBasicCommand(lineText: string): boolean {
    const basicCommands = getBasicCommands();
    for (const command of basicCommands) {
        if (lineText.startsWith(command)) {
            // Verificar se o restante da linha contém um comando de desenvolvimento
            const remainingText = lineText.substring(command.length).trim();
            if (containsForbiddenCommands(remainingText) !== null) {
                return true;
            }
        }
    }
    return false;
}
