'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';

// import { DepNodeProvider, Dependency } from './nodeDependencies';
import { CallTraceProvider, CallTraceItem } from './callTrace';
// import { JsonOutlineProvider } from './jsonOutline';
import { SpecOutlineProvider } from './specOutline';
import { AvailableContractsProvider } from './availableContracts';
import { VariablesItem, VariablesProvider } from './variables';
import { CallResolutionWarningsProvider } from './callResolutionWarnings';



export function activate(context: vscode.ExtensionContext) {
	//console.log(context)
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (!workspaceFolders){
		vscode.window.showInformationMessage('No opened workspace...');
		return
	}
	// console.log(workspaceFolders);
	const root = workspaceFolders[0];
	const rootPath = root.uri.fsPath;
	console.log(rootPath);
	
	try{
		// open the spec file in the editor
		vscode.workspace.findFiles('*/*.spec').then((v) => {
			// console.log(v);
			if (v && v.length > 0){
				const foundFile = v[0];

				var openPath = vscode.Uri.file(foundFile.path);
				vscode.workspace.openTextDocument(openPath).then(doc => {
					vscode.window.showTextDocument(doc);
					// vscode.commands.executeCommand('workbench.action.toggleSidebarVisibility');
				});
				
			}
		});
		
	} catch (e){
		console.log("Couldn't open the spec file");
		console.log(e);
	}

	// read the json file
	const dataPath = rootPath + "/data.json";
	const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

	let main_properties = new Set();
	if (data){
		data.main_table.contractResult.map((contractResult: any) => {
			let ruleName = contractResult.tableRow.ruleName;
			main_properties.add(ruleName);
		});
	}

	const availableContractsTreeProvder = new AvailableContractsProvider(data);
	const availableContractsDisposal = vscode.window.registerTreeDataProvider('availableContracts', availableContractsTreeProvder);

	context.subscriptions.push(availableContractsDisposal);

	const specTreeProvder = new SpecOutlineProvider(data);
	const specTreeProvderDisposal = vscode.window.registerTreeDataProvider('specOutline', specTreeProvder);
	context.subscriptions.push(specTreeProvderDisposal);
	try{
		// vscode.commands.executeCommand('workbench.action.explorer.focus');
		vscode.commands.executeCommand('specOutline.focus');
	}  catch (e){
		console.log("Couldn't focus on specOutline");
		console.log(e);
	}

	// Samples of `window.registerTreeDataProvider`
	const callT = new CallTraceProvider(null);
	vscode.window.registerTreeDataProvider('callTrace', callT);
	vscode.commands.registerCommand('callTrace.refresh', (callTraceData: any) => callT.refresh(callTraceData));
	

	const commandDisposal = vscode.commands.registerCommand(
		'extension.showDetails', 
		async (propertyName: string, ruleName?: string) => {
			console.log("registerCommand");
			console.log(propertyName);
			let callTrace: any;
			let variables: any;
			let assertMessages: string[];
			let callResolutionWarnings: any;
			let vars_disposable: vscode.TreeView<VariablesItem>;

			if (main_properties.has(propertyName)){
				let results = data.main_table.contractResult.find((obj: any) => obj.tableRow.ruleName === propertyName);
				// console.log("has");
				// console.log(results);
				callTrace = results.callTrace;
				variables = results.variables;
				assertMessages = results.assertMessage;
				callResolutionWarnings = results.callResolutionWarningsTable?.callResolutionWarnings;
			} else {
				const st = data.sub_tables;
				const parametricPropertyMethodsResults = st.functionResults.find((obj: any) => 
				obj.ruleName === ruleName);
				// console.log("has not");
				// console.log(parametricPropertyMethodsResults);
				const currentMethod = parametricPropertyMethodsResults.tableBody.find((obj: any) => obj.tableRow.funcName === propertyName);
				callTrace = currentMethod.callTrace;
				variables = currentMethod.variables;
				assertMessages = currentMethod.assertMessage;
				callResolutionWarnings = currentMethod.callResolutionWarningsTable?.callResolutionWarnings;
			}

			// create a call trace view
			try{
				// remove previous subscription:
				// const some = context.subscriptions.slice(3);
				// for (let index = 0; index < some.length; index++) {
				// 	const element = some[index];
				// 	console.log(element);
				// 	element.dispose();
				// }
				
				console.log("CallTraceProvider");
				if (callTrace)
					vscode.commands.executeCommand('callTrace.refresh', callTrace);
				// const callT = new CallTraceProvider(callTrace);
				// const disposable = vscode.window.createTreeView('callTrace', {
				// 	treeDataProvider: callT,
				// });
				// context.subscriptions.push(disposable);
				vscode.commands.executeCommand('setContext', 'callTraceDefined', true);
			} catch (e){
				console.log("Couldn't create a tree view for call trace");
				console.log(e);
			}
			
			try{
				// create a variables view
				console.log("VariablesProvider");
				const varP = new VariablesProvider(variables);
				vars_disposable = vscode.window.createTreeView('variables', {
					treeDataProvider: varP,
				});
				context.subscriptions.push(vars_disposable);
				const VariablesItems  =	varP.getChildren();			
				vscode.commands.executeCommand('setContext', 'propertyChosen', true).then(() => {
					vars_disposable.reveal(VariablesItems ? VariablesItems[0] : null).then(() => {
						console.log("just finished reveal");
					});
				});
				
			} catch (e){
				console.log("Couldn't create a tree view for variables");
				console.log(e);
			}

			if (assertMessages){
				console.log("assertMessages");
				let assertions = vscode.window.createOutputChannel("Assertions");
				assertions.clear();
				assertMessages.map((assertMsg: string) => {
					//Write to output.
					assertions.appendLine("[ASSERTION] " + assertMsg);
				});			
				assertions.show();
			}

			try{
				// create a variables view
				console.log("callResolutionWarningsProvider");
				const callResolutionWarningsProvider = new CallResolutionWarningsProvider(callResolutionWarnings);
				const call_warn_disposable = vscode.window.createTreeView('callResolutionWarnings', {
					treeDataProvider: callResolutionWarningsProvider,
				});
				context.subscriptions.push(call_warn_disposable);	
			
				vscode.commands.executeCommand('setContext', 'propertyChosen', true);
			} catch (e){
				console.log("Couldn't create a tree view for callResolutionWarnings");
				console.log(e);
			}

			// console.log(context);
		}
		
	);

	context.subscriptions.push(commandDisposal);
	// console.log(context);
	// console.log(context.subscriptions);

	// TODO: diagnostics collection can be used for presenting the errors/warnings
	// however, it has to be connected to a documented

	// const jsonOutlineProvider = new JsonOutlineProvider(context);
	// vscode.window.registerTreeDataProvider('jsonOutline', jsonOutlineProvider);
	// vscode.commands.registerCommand('jsonOutline.refresh', () => jsonOutlineProvider.refresh());
	// vscode.commands.registerCommand('jsonOutline.refreshNode', offset => jsonOutlineProvider.refresh(offset));
	// vscode.commands.registerCommand('jsonOutline.renameNode', offset => jsonOutlineProvider.rename(offset));
	// vscode.commands.registerCommand('extension.openJsonSelection', range => jsonOutlineProvider.select(range));

}