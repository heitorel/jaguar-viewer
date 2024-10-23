import { createConnection, TextDocuments, InitializeParams, Connection, ProposedFeatures, TextDocumentSyncKind } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import chokidar from 'chokidar';
import fs from 'fs';
import path from 'path';



// Crie a conexão do LSP
const connection = createConnection(ProposedFeatures.all);


// Gerencia os documentos abertos pelo cliente
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

// Inicialize o servidor LSP
connection.onInitialize((params: InitializeParams) => {
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      workspace: {
        workspaceFolders: {
          supported: true,
        },
      },
    },
  };
});

// Função para abrir e processar um arquivo
function processFile(filePath: string): void {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      connection.console.error(`Erro ao ler o arquivo: ${err.message}`);
      return;
    }
    connection.console.log(`Arquivo atualizado: ${filePath}`);
    connection.console.log('Conteúdo:' + data);
  });
}

// Monitora o diretório passado como argumento
function watchDirectory(directory: string): void {
  const watcher = chokidar.watch(directory, {
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on('change', (filePath) => {
    connection.console.log(`Arquivo modificado: ${filePath}`);
    processFile(filePath);
  });

  watcher.on('error', (error) => {
    connection.console.error(`Erro no watcher: ${error}`);
  });

  connection.console.log(`Monitorando o diretório: ${directory}`);
}

// Escute por mensagens de inicialização
connection.onInitialized(() => {
  const directoryToWatch = path.resolve(__dirname, '../path_to_your_directory');
  watchDirectory(directoryToWatch);
});

// Escute eventos do LSP
documents.listen(connection);
connection.listen();
