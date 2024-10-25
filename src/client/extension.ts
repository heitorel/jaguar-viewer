import * as vscode from 'vscode';
import * as path from 'path';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
  console.log('Ativando a extensão Jaguar Viewer...');

  let disposable = vscode.commands.registerCommand('extension.openFile', () => {
    console.log("Comando 'Abrir Arquivo Monitorado' executado"); 
  });

  context.subscriptions.push(disposable);

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

  // Inicie o cliente LSP
  client.start().then(() => {
    console.log('Cliente LSP está pronto.');
    
    // Manipulador da solicitação personalizada 'custom/openFile'
    client.onRequest('custom/openFile', (params) => {

      console.log('Requisição custom/openFile recebida:', params);
      const uri = vscode.Uri.parse(params.uri);

      // Normaliza o caminho do URI
      const normalizedPath = uri.fsPath.endsWith('\\') ? uri.fsPath.slice(0, -1) : uri.fsPath;
      const normalizedUri = vscode.Uri.file(normalizedPath);

      console.log('1 '+uri);
      console.log('2 '+normalizedPath);
      console.log('3 '+normalizedUri);

      vscode.workspace.openTextDocument('d:/projetos/imc/target/jaguar2.csv').then((document) => {
        vscode.window.showTextDocument(document);
      });
    });
  }, (error) => {
    console.error('Erro ao iniciar o cliente LSP:', error);
  });
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}