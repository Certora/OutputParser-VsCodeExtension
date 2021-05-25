import * as vscode from 'vscode';
import { AvailableContractsProvider } from './availableContracts';
import { CallResolutionProvider } from './callResolution';
import { CallResolutionWarningsProvider } from './callResolutionWarnings';
import { CallTraceViewProvider } from './callTrace';
import { RecentJobsViewProvider } from './recent';
import { SpecOutlineProvider } from './specOutline';
import { VariablesProvider } from './variables';


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


export function activate(context: vscode.ExtensionContext) {
	// define the availble contracts tree
	const availableContractsTreeProvder = new AvailableContractsProvider(null);
	const availableContractsDisposal = vscode.window.registerTreeDataProvider('availableContracts', availableContractsTreeProvder);
	// When this extension is deactivated the disposables will be disposed
	context.subscriptions.push(availableContractsDisposal);

	vscode.commands.registerCommand('availableContracts.refresh', (data) => {
		availableContractsTreeProvder.refresh(data);
	});

	// define the properties tree
	const specTreeProvder = new SpecOutlineProvider(null);
	const specTreeProviderDisposal = vscode.window.registerTreeDataProvider('specOutline', specTreeProvder);
	context.subscriptions.push(specTreeProviderDisposal);

	vscode.commands.registerCommand('specOutline.refresh', (data) => {
		vscode.commands.executeCommand('setContext', 'callTraceDefined', false);
		vscode.commands.executeCommand('setContext', 'propertyChosen', false);
		specTreeProvder.refresh(data);
		vscode.window.showInformationMessage(`Successfully refreshed spec outline.`);
		vscode.commands.executeCommand('availableContracts.refresh', data).then(() =>
		vscode.window.showInformationMessage(`Successfully refreshed available contracts.`));
	});

	// Define a call trace webview provider
	let callTraceProvider = new CallTraceViewProvider(context.extensionUri, null);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(CallTraceViewProvider.viewType, callTraceProvider));
	
	// Define a command to refresh the call trace
	const callTraceRefresh = vscode.commands.registerCommand(
		'callTrace.refresh', 
		(callTraceData: any) => {
			try{
				callTraceProvider.refresh(callTraceData);
			} catch (e){
				console.log("error on refresh");
				console.log(e);
			}
		}
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
					vscode.commands.executeCommand('callTrace.refresh', callTrace).then(v => {
						// set callTraceDefined = true => callTrace view is visible
						vscode.commands.executeCommand('setContext', 'callTraceDefined', true).then(v => {
							vscode.commands.executeCommand('callTrace.focus').then(() => {
								console.log("callTrace should be at focus now");
							});
						});
					}).then(undefined, err => {
						console.error('Error occurred');
						console.log(err.message);
					 });
				} else {
					vscode.commands.executeCommand('callTrace.refresh', null).then(v => {
						// set callTraceDefined = false => callTrace view is hidden
						// vscode.commands.executeCommand('setContext', 'callTraceDefined', false).then(v => {
						// 	console.log("invisible calltrace");
						// });
					}).then(undefined, err => {
						console.error('Error occurred when running callTrace.refresh with null');
						console.log(err.message);
					 });
				}
				
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
					/*vscode.commands.executeCommand('callResolutionWarnings.focus').then(() => {
						console.log("focus on the callResolutionWarnings view");
					});*/
					console.log("focus on the callResolutionWarnings view");
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
					/*vscode.commands.executeCommand('callResolution.focus').then(() => {
						console.log("focus on the callResolution view");
					});*/
					console.log("focus on the callResolution view");
				});
			} catch (e){
				console.log("Couldn't create a tree view for callResolution");
				console.log(e);
			}

			// console.log(context);
		}
		
	);

	context.subscriptions.push(commandDisposal);


	const recentJobsprovider = new RecentJobsViewProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(RecentJobsViewProvider.viewType, recentJobsprovider));

	context.subscriptions.push(
		vscode.commands.registerCommand('recent.addJob', async () => {
			let output_url = await vscode.window.showInputBox({ placeHolder: 'Output url' });
			const data = "data.json";
			if (output_url) {
				console.log('output_url:' + output_url);
				let msg = await vscode.window.showInputBox({ placeHolder: 'Message? type the message or press Escape' });
				console.log(msg);
				const args_index = output_url.indexOf("?");
				if (args_index != -1){
					const url = output_url.slice(0, args_index);
					const args = output_url.slice(args_index);	
					const data_url = url + data + args;
					recentJobsprovider.addJob(data_url, msg);
				} else if(output_url.endsWith("/")){  // no anonymous key
					recentJobsprovider.addJob(output_url + data, msg);
				}else {
					vscode.window.showErrorMessage("Wrong output url format...")
				}
			}
		}));
	
}



