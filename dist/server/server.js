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
    console.log("passou aqui");
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
// Notificar o cliente para abrir o arquivo
function notifyClientToOpenFile(filePath) {
    connection.sendRequest('custom/openFile', { uri: `file://${filePath}` });
}
// Monitora o diretório passado como argumento
function watchDirectory(directory) {
    const watcher = chokidar_1.default.watch(directory, {
        persistent: true
    });
    watcher.on('change', (filePath) => {
        connection.console.log(`Arquivo modificado: ${filePath}`);
        processFile(filePath);
    });
    watcher.on('error', (error) => {
        connection.console.error(`Erro no watcher: ${error}`);
    });
    connection.console.log(`Monitorando o diretório: ${directory}`);
    watcher.on('add', (filePath) => {
        connection.console.log(`Arquivo criado: ${filePath}`);
        processFile(filePath);
        notifyClientToOpenFile(filePath); // Notifica o cliente para abrir o arquivo
    });
    watcher.on('change', (filePath) => {
        connection.console.log(`Arquivo modificado: ${filePath}`);
        processFile(filePath);
        notifyClientToOpenFile(filePath); // Notifica o cliente para abrir o arquivo
    });
}
// Escute por mensagens de inicialização
connection.onInitialized(() => {
    const directoryToWatch = path_1.default.resolve(__dirname, 'D:/Projetos/IMC/target');
    watchDirectory(directoryToWatch);
});
// Escute eventos do LSP
documents.listen(connection);
connection.listen();
