"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const chokidar_1 = __importDefault(require("chokidar"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Crie a conexão do LSP
const connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
// Gerencia os documentos abertos pelo cliente
const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
// Inicialize o servidor LSP
connection.onInitialize((params) => {
    return {
        capabilities: {
            textDocumentSync: node_1.TextDocumentSyncKind.Incremental,
            workspace: {
                workspaceFolders: {
                    supported: true,
                },
            },
        },
    };
});
// Função para abrir e processar um arquivo
function processFile(filePath) {
    fs_1.default.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            connection.console.error(`Erro ao ler o arquivo: ${err.message}`);
            return;
        }
        connection.console.log(`Arquivo atualizado: ${filePath}`);
        connection.console.log('Conteúdo:' + data);
    });
}
// Monitora o diretório passado como argumento
function watchDirectory(directory) {
    const watcher = chokidar_1.default.watch(directory, {
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
    const directoryToWatch = path_1.default.resolve(__dirname, '../path_to_your_directory');
    watchDirectory(directoryToWatch);
});
// Escute eventos do LSP
documents.listen(connection);
connection.listen();
