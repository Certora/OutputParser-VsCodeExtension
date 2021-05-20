import * as vscode from 'vscode';
import * as fs from 'fs';

export class RecentJobsViewProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'recentJobs';

	private _view?: vscode.WebviewView;

	private _jobs : [{}];

	constructor(
		private readonly _extensionUri: vscode.Uri
		//private _callTrace: { [x: string]: any; }, //: { [key: string]: string, ["childrenList": string] : [] } ,
	) { 

		// console.log(process.env.CERTORA);
		const certora_path = process.env.CERTORA;
		try {
			const jobs = JSON.parse(fs.readFileSync(certora_path + "/recent_jobs.json", 'utf-8'));
			console.log("recent jobs");
			jobs.forEach((job: JSON) => {
				console.log(job);
			});
			this._jobs = jobs;
		} catch (e){
			console.log("Couldn't read recent_jobs file");
			console.log(e.message);
		}

	}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		console.log("resolve");
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(data => {
			// const axios = require('axios');
			switch (data.type) {
				case 'colorSelected':
					{
						vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString(`#${data.value}`));
						break;
					}
				case 'jobSelected':
					{
						console.log(data.value);
						console.log(process.env.CERTORAKEY);
						// Make a request for a user with a given ID
						/*axios.get('https://vaas-stg.certora.com/jobsData', 
						{ params: {
							jobId: data.value,
							certoraKey: process.env.CERTORAKEY}
						}).then(function (resp: any) {
							// handle success																																											
							console.log(resp);
							if (resp.status == 200){
								const d = resp.data;
								if (d.success){  // on success
									if (d.userJobsList.length > 0){
										const found_job = d.userJobsList[0]; // should be a single job
										data_url = `${found_job.outputUrl}data.json?anonymousKey=${found_job.anonymousKey}`;
									} else if(d.missingOutput.length1 > 0){  // requested job is missing the output
										console.log("Missing");
									}
								} else {
									console.log(d.errorString);
								}
							} else {
								console.log("ERROR. status code is " + resp.status);
							}
						}).catch(function (error: any) {
							// handle error
							console.log(error);
						}).then(function () {
							// always executed
							console.log("the always part");
							if (data_url){								
								// Make a request for a user with a given ID
								axios.get(data_url).then(function (response: any) {
									// handle success
									console.log(response);
								}).catch(function (error: any) {
									// handle error
									console.log(error);
								}).then(function () {
									// always executed
								});
							} else {
								console.log("Empty data url");
							}
						});*/
						break;
					}
			}
		});
	}

	/*public addColor() {
		if (this._view) {
			this._view.show?.(true); // `show` is not implemented in 1.49 but is for 1.50 insiders
			this._view.webview.postMessage({ type: 'addColor' });
		}
	}

	public clearColors() {
		if (this._view) {
			this._view.webview.postMessage({ type: 'clearColors' });
		}
	}*/

	private _getHtmlForWebview(webview: vscode.Webview) {
		console.log("_gethtml");
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));

		// Do the same for the stylesheet.
		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));

		// Use a nonce to only allow a specific script to be run.
		const nonce = getNonce();

		let recent_jobs = `<div id="links" class="list-group">`;

		this._jobs.forEach((job: any) => {
			console.log(job);
			recent_jobs += `<a class="clicks list-group-item list-group-item-action`;
			if (job.isDev)
				recent_jobs += ` dev`;
			recent_jobs += `" id="${job.jobId}" class="recent-job">${job.jobId}`;
			if (job.notifyMsg)
				recent_jobs += ` - ${job.notifyMsg}`;
			recent_jobs += `</a>`;
		});
		recent_jobs += `</div>`;
        
        // console.log(nonce);
        // console.log(webview.cspSource);

        // console.log(styleResetUri);
        // console.log(styleVSCodeUri);
        // console.log(styleMainUri);
        // console.log(scriptUri);

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">
				
				<title>Recent Jobs</title>
			</head>
			<body>
                <h2>Recent jobs</h2>
				<ul id="recent_jobs"></ul>
				${recent_jobs}
				
			</body>
			</html>`;
	}

	refresh(callTraceData: any): void {
		console.log("callTrace Refreshed");
		try{
		// this._callTrace = callTraceData;
		if (this._view)
			this._view.webview.html = this._getHtmlForWebview(this._view.webview);
		} catch (e){
			console.log("inside refresh");
			console.log(e);
		}
		// this._onDidChangeTreeData.fire();
	}
}

function getClass(status: string) : string {
	let clsName = "";
    switch (status) {
        case 'SUCCESS':
            clsName = "badge-success";
            break;
        case 'REVERT':
            clsName = "badge-warning";
            break;
        case 'THROW':
            clsName = "badge-danger";
            break;
		case 'SUMMARIZED':
			clsName = "w3-win8-cobalt";
			break;
		case 'DISPATCHER':
			clsName = "w3-win8-magenta";
			break;
        case 'DEFAULT HAVOC':
			clsName = "badge-danger";
			break;
        default:
            clsName ="badge-light";
    }
	return clsName;
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}