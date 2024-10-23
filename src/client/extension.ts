import * as path from 'path';
import { workspace, ExtensionContext } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
  // Local do servidor LSP
  const serverModule = context.asAbsolutePath(path.join('server', 'out', 'server.js'));

  // Configurações para iniciar o servidor no processo Node.js
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: { module: serverModule, transport: TransportKind.ipc }
  };

  // Opções do cliente LSP
  const clientOptions: LanguageClientOptions = {
    // Registra o servidor para documentos de texto abertos
    documentSelector: [{ scheme: 'file', language: 'plaintext' }],
    synchronize: {
      // Notifica o servidor de mudanças no diretório
      fileEvents: workspace.createFileSystemWatcher('**/*')
    }
  };

  // Cria o cliente LSP e inicia o cliente.
  client = new LanguageClient(
    'fileWatcherLSP',
    'File Watcher LSP',
    serverOptions,
    clientOptions
  );

  // Inicia o cliente.
  client.start();
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
