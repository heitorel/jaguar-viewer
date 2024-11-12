import { createConnection, TextDocuments, InitializeParams, ProposedFeatures, TextDocumentSyncKind } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import chokidar from 'chokidar';
import fs from 'fs';
import path from 'path';

const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

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

// Função para processar o arquivo CSV e criar o arquivo log formatado
function processFile(filePath: string): void {
  const logPath = filePath.replace('.csv', '.log');
  
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      connection.console.error(`Erro ao ler o arquivo: ${err.message}`);
      return;
    }

    const header = ['Ranking', 'Class', 'Line', 'CNF', 'CNP', 'CEF', 'CEP', 'Suspension'];
    const lines = data.trim().split('\n').map(line => line.split(','));

    // Adiciona a coluna de "Ranking" como índice
    const rankedLines = lines.map((line, index) => [String(index + 1), ...line]);

    // Calcula a largura máxima para cada coluna, incluindo o cabeçalho e as linhas de dados
    const columnWidths = header.map((title, colIndex) => {
      return Math.max(
        title.length,
        ...rankedLines.map(line => (line[colIndex] || '').length)
      );
    });

    // Função auxiliar para formatar cada linha com espaçamento fixo entre colunas
    const formatLine = (columns: string[], widths: number[]) => {
      return columns.map((col, i) => (col || '').padEnd(widths[i])).join(' ');
    };

    // Formata o cabeçalho
    const formattedHeader = formatLine(header, columnWidths);

    // Formata as linhas de dados com base nas larguras calculadas
    const formattedLines = rankedLines.map(line => formatLine(line, columnWidths));

    // Junta o cabeçalho e as linhas formatadas sem linhas em branco entre elas
    const logContent = [formattedHeader, ...formattedLines].join('\n');

    // Escreve o conteúdo formatado no arquivo .log
    fs.writeFile(logPath, logContent, (err) => {
      if (err) {
        connection.console.error(`Erro ao criar o arquivo .log: ${err.message}`);
        return;
      }

      connection.console.log(`Arquivo log criado e atualizado: ${logPath}`);
      notifyClientToOpenFile(logPath); // Notifica o cliente para abrir o arquivo .log
    });
  });
}

// Notificar o cliente para abrir o arquivo .log
function notifyClientToOpenFile(filePath: string): void {
  connection.sendRequest('custom/openLogFile', { uri: filePath });
}

// Monitora o diretório e aciona a função de processamento ao detectar modificações
function watchDirectory(filePath: string): void {
  const watcher = chokidar.watch(filePath, { persistent: true });

  watcher.on('error', (error: any) => {
    connection.console.error(`Erro no watcher: ${error}`);
  });

  connection.console.log(`Monitorando o arquivo: ${filePath}`);
  
  watcher.on('add', (filePath: string) => {
    connection.console.log(`Arquivo criado: ${filePath}`);
    processFile(filePath); 
  });
  
  watcher.on('change', (filePath: string) => {
    connection.console.log(`Arquivo modificado: ${filePath}`);
    processFile(filePath); // Processa e notifica para abrir o arquivo .log
  });
}

// Configuração para monitorar o diretório da workspace
connection.onInitialized(() => {
  connection.workspace.getWorkspaceFolders().then((workspaceFolders) => {
    if (workspaceFolders && workspaceFolders.length > 0) {
      const workspaceUri = workspaceFolders[0].uri;
      let workspacePath = workspaceUri.startsWith('file://')
        ? decodeURIComponent(workspaceUri.slice(7))
        : decodeURIComponent(workspaceUri);

      if (workspacePath.startsWith('/') || workspacePath.startsWith('\\')) {
        workspacePath = workspacePath.slice(1);
      }

      const directoryToWatch = path.join(workspacePath, 'target', 'jaguar2.csv');
      connection.console.log(`Monitorando o caminho dinâmico: ${directoryToWatch}`);
      watchDirectory(directoryToWatch);
    } else {
      connection.console.error('Nenhum workspace ativo foi encontrado.');
    }
  }).catch((error) => {
    connection.console.error(`Erro ao obter os workspaces: ${error.message}`);
  });
});

documents.listen(connection);
connection.listen();