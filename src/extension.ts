"use strict";
import * as vscode from 'vscode';
import init from "./int";


export function activate(context: vscode.ExtensionContext){
    console.log('A extensão "vcpk" foi ativada.');
    init(context)
}

export function deactivate() {
    console.log('A extensão "vcpk" foi desativada.');
}