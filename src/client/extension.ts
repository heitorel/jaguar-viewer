import * as vscode from 'vscode';
import * as path from 'path';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
  console.log('Ativando a extensão Jaguar Viewer...');

  const serverModule = context.asAbsolutePath(path.join('out', 'server', 'server.js'));

  // Configuração do servidor
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: { module: serverModule, transport: TransportKind.ipc },
  };

  // Configuração do cliente
  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'plaintext' }],
    synchronize: {
      fileEvents: vscode.workspace.createFileSystemWatcher('**/*.csv')
    },
  };

  // Criar o cliente LSP e iniciar o servidor
  client = new LanguageClient(
    'JaguarViewerLanguageServer',
    'Jaguar Viewer Language Server',
    serverOptions,
    clientOptions
  );

  console.log('Iniciando o cliente LSP...');

  client.start().then(() => {
    console.log('Cliente LSP está pronto.');

    // Manipulador da solicitação personalizada 'custom/openLogFile'
    client.onRequest('custom/openLogFile', async (params: { uri: string }) => {
      try {
        const uri = vscode.Uri.file(params.uri);
        const document = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(document);
        console.log(`Arquivo .log aberto automaticamente: ${params.uri}`);
      } catch (error) {
        console.error(`Erro ao abrir o arquivo .log: ${params.uri}`, error);
      }
    });
  }, (error) => {
    console.error('Erro ao iniciar o cliente LSP:', error);
  });

  // Variáveis para controlar o estado de abertura e a última linha selecionada
  let isInitialOpening = true;
  let lastSelectedLine: number | null = null;

  // Evento para detectar cliques em qualquer seleção de editor ativo
  vscode.window.onDidChangeTextEditorSelection(async (event) => {
    const document = event.textEditor.document;

    // Certifica-se de que o arquivo aberto seja um .log
    if (!document.fileName.endsWith('.log')) return;

    // Ignora a primeira seleção após a abertura do .log
    if (isInitialOpening) {
      isInitialOpening = false;
      lastSelectedLine = event.selections[0].start.line; // Atualiza a última linha selecionada inicial
      return;
    }

    const selectedLine = event.selections[0].start.line;

    // Verifica se a linha selecionada mudou em relação à última seleção
    if (selectedLine === lastSelectedLine) return;
    lastSelectedLine = selectedLine;

    const lineText = document.lineAt(selectedLine).text;
    console.log(`Linha selecionada no .log: ${lineText}`);

    // Extraindo o caminho do arquivo e número da linha da linha do .log
    const [ , classPath, lineNumber ] = lineText.split(/\s+/);

    // Obter a primeira workspace para construir o caminho absoluto
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      const workspaceFolder = workspaceFolders[0].uri.fsPath;

      // Constrói o caminho completo combinando a workspace com o caminho relativo do arquivo
      const fullPath = path.join(workspaceFolder, 'src', 'main', 'java', classPath) + '.java';
      const line = parseInt(lineNumber, 10);

      console.log(`Extraído do .log - Caminho completo: ${fullPath}, Linha: ${line}`);

      // Verifica se o arquivo existe antes de tentar abrir
      try {
        await vscode.workspace.fs.stat(vscode.Uri.file(fullPath));
        vscode.commands.executeCommand('extension.openFileAtLine', fullPath, line);
        console.log(`Comando para abrir o arquivo no caminho ${fullPath} na linha ${line} foi executado.`);
      } catch (err) {
        console.error(`Arquivo não encontrado: ${fullPath}`, err);
      }
    } else {
      console.error("Nenhuma workspace aberta.");
    }
  });

  // Comando para abrir o arquivo na linha especificada
  const openFileCommand = vscode.commands.registerCommand('extension.openFileAtLine', async (filePath: string, lineNumber: number) => {
    try {
      const fileUri = vscode.Uri.file(filePath);
      const document = await vscode.workspace.openTextDocument(fileUri);
      const editor = await vscode.window.showTextDocument(document);

      const position = new vscode.Position(lineNumber - 1, 0);
      editor.selection = new vscode.Selection(position, position);
      editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
      
      console.log(`Arquivo aberto: ${filePath} na linha ${lineNumber}`);
    } catch (error) {
      console.error(`Erro ao abrir o arquivo: ${filePath} na linha ${lineNumber}`, error);
    }
  });

  context.subscriptions.push(openFileCommand);

  // Resetar o estado de abertura inicial e última linha selecionada quando o .log for fechado
  vscode.workspace.onDidCloseTextDocument((document) => {
    if (document.fileName.endsWith('.log')) {
      isInitialOpening = true;
      lastSelectedLine = null;
    }
  });
}

export function deactivate(): Thenable<void> | undefined {
  return client ? client.stop() : undefined;
}
