import { createConnection, TextDocuments, InitializeParams, ProposedFeatures, TextDocumentSyncKind } from 'vscode-languageserver/node';
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
  connection.console.log("Servidor LSP inicializado");
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
    connection.console.log('Conteúdo: ' + data);
  });
}

// Notificar o cliente para abrir o arquivo
function notifyClientToOpenFile(filePath: string): void {
  // Verifica se o path é um arquivo
  if (fs.lstatSync(filePath).isFile() && fs.existsSync(filePath)) {
    const uriPath = filePath.endsWith('\\') ? filePath.slice(0, -1) : filePath; // Remove a barra se existir
    connection.sendRequest('custom/openFile', { uri: `file://${uriPath}` });
  } else {
    connection.console.error(`O caminho não é um arquivo: ${filePath}`);
  }
}


// Monitora o diretório passado como argumento
function watchDirectory(filePath: string): void {
  const watcher = chokidar.watch(filePath, { persistent: true });

  watcher.on('error', (error) => {
    connection.console.error(`Erro no watcher: ${error}`);
  });

  connection.console.log(`Monitorando o arquivo: ${filePath}`);
  
  watcher.on('add', (filePath) => {
    connection.console.log(`Arquivo criado: ${filePath}`);
    //processFile(filePath);
    notifyClientToOpenFile(filePath); 
  });
  
  watcher.on('change', (filePath) => {
    connection.console.log(`Arquivo modificado: ${filePath}`);
    //processFile(filePath);
    notifyClientToOpenFile(filePath); // Notifica o cliente para abrir o arquivo
  });
}

// Escute por mensagens de inicialização
connection.onInitialized(() => {
  setTimeout(() => {
    const directoryToWatch = path.resolve(__dirname, 'D:/Projetos/IMC/target/jaguar2.csv');
    connection.console.log(`Atrasando o monitoramento do arquivo: ${directoryToWatch}`);
    watchDirectory(directoryToWatch);
  }, 10000); 
});


// Escute eventos do LSP
documents.listen(connection);
connection.listen();