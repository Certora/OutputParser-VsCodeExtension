'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';

import { CallTraceProvider } from './callTrace';
import { SpecOutlineProvider } from './specOutline';
import { AvailableContractsProvider } from './availableContracts';
import { VariablesProvider } from './variables';
import { CallResolutionWarningsProvider } from './callResolutionWarnings';
import { CallResolutionProvider } from './callResolution';

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

function getData(rootPath: string) : any {
	// read the json file - expected to be in the working directory
	const dataPath = rootPath + "/data.json";
	const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
	return data;
}

function getMainProperties(data: any): Set<any> {
	let main_properties = new Set();
	if (data){
		data.main_table.contractResult.map((contractResult: any) => {
			let ruleName = contractResult.tableRow.ruleName;
			main_properties.add(ruleName);
		});
	}
	return main_properties;
}

export async function activate(context: vscode.ExtensionContext) {
	//console.log(context)
	// let isDefined = false;
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (!workspaceFolders){
		vscode.window.showInformationMessage('No opened workspace...');
		return
	}
	const root = workspaceFolders[0];
	const rootPath = root.uri.fsPath;
	console.log(rootPath);
	
	try{
		// open the spec file in the editor
		vscode.workspace.findFiles('*/*.spec').then((specFilesList) => {
			if (specFilesList && specFilesList.length > 0){
				const foundFile = specFilesList[0];

				var openPath = vscode.Uri.file(foundFile.path);
				vscode.workspace.openTextDocument(openPath).then(doc => {
					vscode.window.showTextDocument(doc);
				});
			} else {
				console.log("Couldn't find a spec file")
			}
		});
	} catch (e){
		console.log("Couldn't open the spec file");
		console.log(e);
	}

	const data = getData(rootPath);

	let main_properties = new Set();

	main_properties = getMainProperties(data);

	// define the availble contracts tree
	const availableContractsTreeProvder = new AvailableContractsProvider(data);
	const availableContractsDisposal = vscode.window.registerTreeDataProvider('availableContracts', availableContractsTreeProvder);
	// When this extension is deactivated the disposables will be disposed
	context.subscriptions.push(availableContractsDisposal);

	vscode.commands.registerCommand('availableContracts.refresh', () => {
		const data = getData(rootPath);
		availableContractsTreeProvder.refresh(data);
	});

	// define the properties tree
	const specTreeProvder = new SpecOutlineProvider(data);
	const specTreeProviderDisposal = vscode.window.registerTreeDataProvider('specOutline', specTreeProvder);
	context.subscriptions.push(specTreeProviderDisposal);

	vscode.commands.registerCommand('specOutline.refresh', () => {
		vscode.commands.executeCommand('setContext', 'callTraceDefined', false);
		vscode.commands.executeCommand('setContext', 'propertyChosen', false);
		const data = getData(rootPath);
		specTreeProvder.refresh(data);
		vscode.window.showInformationMessage(`Successfully refreshed spec outline.`);
		vscode.commands.executeCommand('availableContracts.refresh').then(() =>
		vscode.window.showInformationMessage(`Successfully refreshed available contracts.`));
	});
	try{
		// vscode.commands.executeCommand('workbench.action.explorer.focus');
		vscode.commands.executeCommand('specOutline.focus');
	}  catch (e){
		console.log("Couldn't focus on specOutline view");
		console.log(e);
	}

	// Define a call trace tree provider
	const callTraceProvider = new CallTraceProvider(null);
	const callTraceProviderDisposal = vscode.window.registerTreeDataProvider('callTrace', callTraceProvider);
	context.subscriptions.push(callTraceProviderDisposal);
	
	// Define a command to refresh the call trace tree
	const callTraceRefresh = vscode.commands.registerCommand(
		'callTrace.refresh', 
		(callTraceData: any) => callTraceProvider.refresh(callTraceData)
	);
	context.subscriptions.push(callTraceRefresh);

	// Define a variables tree provider
	const varsProvider = new VariablesProvider(null);
	const varsProviderDisposal = vscode.window.registerTreeDataProvider('variables', varsProvider);
	context.subscriptions.push(varsProviderDisposal);

	// Define a command to refresh the variables tree
	const variablesRefresh = vscode.commands.registerCommand(
		'variables.refresh', 
		(variablesData: any) => varsProvider.refresh(variablesData)
	);
	context.subscriptions.push(variablesRefresh);

	// Define a call resolution warnings tree provider
	const callResolutionWarningsProvider = new CallResolutionWarningsProvider(null);
	const callResWarnsDisposal = vscode.window.registerTreeDataProvider('callResolutionWarnings', callResolutionWarningsProvider);
	context.subscriptions.push(callResWarnsDisposal);

	// Define a command to refresh the call resolution warnings tree
	const callResWarnsRefresh = vscode.commands.registerCommand(
		'callResolutionWarnings.refresh', 
		(callResolutionWarningsData: any) => callResolutionWarningsProvider.refresh(callResolutionWarningsData)
	);
	context.subscriptions.push(callResWarnsRefresh);

	// Define a call resolution warnings tree provider
	const callResolutionProvider = new CallResolutionProvider(null);
	const callResDisposal = vscode.window.registerTreeDataProvider('callResolution', callResolutionProvider);
	context.subscriptions.push(callResDisposal);

	// Define a command to refresh the call resolution warnings tree
	const callResRefresh = vscode.commands.registerCommand(
		'callResolution.refresh', 
		(callResolutionData: any) => callResolutionProvider.refresh(callResolutionData)
	);
	context.subscriptions.push(callResRefresh);

	let assertions = vscode.window.createOutputChannel("Assertions");

	const commandDisposal = vscode.commands.registerCommand(
		'extension.showDetails', 
		async (data: any, propertyName: string, ruleName?: string) => {
			console.log("registerCommand");
			console.log(propertyName);
			let callTrace: any;
			let variables: any;
			let assertMessages: string[];
			let callResolutionWarnings: any;
			let callResolution: any;
			let main_properties = getMainProperties(data);
			
			// fetch data
			if (main_properties.has(propertyName)){
				let results = data.main_table.contractResult.find((obj: any) => obj.tableRow.ruleName === propertyName);

				callTrace = results.callTrace;
				variables = results.variables;
				assertMessages = results.assertMessage;
				callResolutionWarnings = results.callResolutionWarningsTable?.callResolutionWarnings;
				callResolution = results.callResolutionTable?.callResolution;
			} else {
				const st = data.sub_tables;
				const parametricPropertyMethodsResults = st.functionResults.find((obj: any) => 
				obj.ruleName === ruleName);
				const currentMethod = parametricPropertyMethodsResults.tableBody.find((obj: any) => obj.tableRow.funcName === propertyName);
				
				callTrace = currentMethod.callTrace;
				variables = currentMethod.variables;
				assertMessages = currentMethod.assertMessage;
				callResolutionWarnings = currentMethod.callResolutionWarningsTable?.callResolutionWarnings;
				callResolution = currentMethod.callResolutionTable?.callResolution;
			}

			try{				
				console.log("CallTraceProvider");
				// update the call trace view
				if (callTrace){
					vscode.commands.executeCommand('callTrace.refresh', callTrace);
				} else {
					vscode.commands.executeCommand('callTrace.refresh', null);
				}
				// set callTraceDefined = true => callTrace view is visible
				vscode.commands.executeCommand('setContext', 'callTraceDefined', true).then(v => {
					vscode.commands.executeCommand('callTrace.focus').then(() => {
						console.log("callTrace should be at focus now");
					});
				});
			} catch (e){
				console.log("Couldn't create a tree view for call trace");
				console.log(e);
			}
			
			try{				
				console.log("VariablesProvider");
				// update the variables view
				if (variables){
					vscode.commands.executeCommand('variables.refresh', variables);
				} else {
					vscode.commands.executeCommand('variables.refresh', null);
				}

				try{
					vscode.commands.executeCommand('setContext', 'propertyChosen', true).then(async () => {
						console.log("propertyChosen is set to true");
						
						// VIP: the following delay is required so that the 
						// detailed-information container view is triggered on the first call						
						/*if (!isDefined){
							isDefined = true;
							await delay(1000);
							console.log("delay finished");
						}*/
						vscode.commands.executeCommand('variables.focus').then(() => {
							console.log("focus on the variables view");
						});
					});
					
				}  catch (e){
					console.log("Couldn't focus on variables");
					console.log(e);
				}
			} catch (e){
				console.log("Couldn't create a tree view for variables");
				console.log(e);
			}

			if (assertMessages){
				console.log("assertMessages");
				assertions.clear(); // clear previous messages
				assertMessages.map((assertMsg: string) => {
					//Write to output
					assertions.appendLine("[ASSERTION] " + assertMsg);
				});			
				assertions.show();
			}

			try{
				console.log("callResolutionWarningsProvider");
				// update the variables view
				if (callResolutionWarnings){
					vscode.commands.executeCommand('callResolutionWarnings.refresh', callResolutionWarnings);
				} else {
					vscode.commands.executeCommand('callResolutionWarnings.refresh', null);
				}
			
				vscode.commands.executeCommand('setContext', 'propertyChosen', true).then(() => {
					vscode.commands.executeCommand('callResolutionWarnings.focus').then(() => {
						console.log("focus on the callResolutionWarnings view");
					});
				});
			} catch (e){
				console.log("Couldn't create a tree view for callResolutionWarnings");
				console.log(e);
			}


			try{
				console.log("callResolutionProvider");
				// update the variables view
				if (callResolution){
					vscode.commands.executeCommand('callResolution.refresh', callResolution);
				} else {
					vscode.commands.executeCommand('callResolution.refresh', null);
				}
			
				vscode.commands.executeCommand('setContext', 'propertyChosen', true).then(() => {
					vscode.commands.executeCommand('callResolution.focus').then(() => {
						console.log("focus on the callResolution view");
					});
				});
			} catch (e){
				console.log("Couldn't create a tree view for callResolution");
				console.log(e);
			}

			// console.log(context);
		}
		
	);

	context.subscriptions.push(commandDisposal);

	// TODO: diagnostics collection can be used for presenting the errors/warnings
	// however, it has to be connected to a documented

}