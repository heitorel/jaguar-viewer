"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const node_1 = require("vscode-languageclient/node");
let client;
function activate(context) {
    // Configuração do servidor
    const serverOptions = {
        run: { module: context.asAbsolutePath(path.join('server', 'out', 'server.js')), transport: node_1.TransportKind.ipc },
        debug: { module: context.asAbsolutePath(path.join('server', 'out', 'server.js')), transport: node_1.TransportKind.ipc }
    };
    // Configuração do cliente
    const clientOptions = {
        documentSelector: [{ scheme: 'file', language: 'plaintext' }],
    };
    // Criar o cliente LSP e iniciar o servidor
    client = new node_1.LanguageClient('languageServerExample', 'Language Server Example', serverOptions, clientOptions);
    // Inicie o cliente LSP
    client.start();
    // Após o cliente estar pronto, configure o handler para a requisição customizada
    client.onNotification('custom/openFile', async (params) => {
        const document = await vscode.workspace.openTextDocument(vscode.Uri.parse(params.uri));
        vscode.window.showTextDocument(document);
    });
}
exports.activate = activate;
function deactivate() {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
exports.deactivate = deactivate;
