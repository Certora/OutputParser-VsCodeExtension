import * as vscode from 'vscode';
import * as fs from 'fs';

export class RecentJobsViewProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'renectJobsView';

	private _view?: vscode.WebviewView;

	private _jobs: any[] = [];

	private _data: any;

	private _recent_path: string;

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { 
		console.log(process.env.CERTORA);
		const certora_path = process.env.CERTORA;
		this._recent_path = certora_path + "/.certora_recent_jobs.json";
		try {
			const jobs = JSON.parse(fs.readFileSync(this._recent_path, 'utf-8'));
			console.log("recent jobs");
			const data = "data.json";
			jobs.forEach((job: any) => {
				console.log(job);
				if (job.output_url) {
					if (!job.output_url.includes(data)){
						console.log('output_url:' + job.output_url);
						const args_index = job.output_url.indexOf("?");
						if (args_index != -1){
							const url = job.output_url.slice(0, args_index);
							const args = job.output_url.slice(args_index);	
							job.output_url = url + data + args;
						} else if(job.output_url.endsWith("/")){  // no anonymous key
							job.output_url += data;
						}else {
							vscode.window.showErrorMessage("Wrong output url format...");
						}
					}
				} else {
					vscode.window.showErrorMessage("Missing output url...");
				}
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
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		this.updateJobs();

		webviewView.onDidDispose(
			() => {
				// When the panel is closed, cancel any future updates to the webview content
				// clearInterval(interval);
				console.log("dispose");
				const d = JSON.stringify(this._jobs);
				fs.writeFileSync(this._recent_path, d);
			});

		webviewView.webview.onDidReceiveMessage(data => {
			const axios = require('axios');

			switch (data.type) {
				case 'addJob':
					{
						vscode.commands.executeCommand('recent.addJob');
						break;
					}
				case 'jobSelected':
					{
						console.log(data.value);
						// console.log(process.env.CERTORAKEY);
						// vscode.window.showInformationMessage(`Searching for job with id=${data.value}`);
						const output_url = data.output_url;
						const jobId = data.value;
						const msg = data.msg;
						vscode.window.showInformationMessage(`Gettings job results...`);
						axios.get(output_url, 
						{ params: {
							certoraKey: process.env.CERTORAKEY}
						}).then( async (response: any) => {
							// handle success							
							if(response.status == 200){
								// handle success
								console.log(response);
								this._data = response.data;
								vscode.window.showInformationMessage(`Successfullly retrieved job results.`);
								vscode.commands.executeCommand('specOutline.refresh', this.getData());
								const new_job:any = {};
								new_job.output_url = output_url;
								new_job.notifyMsg = msg;
								if ( jobId )
									new_job.jobId = jobId;
								if (!this.job_exists(new_job)){
									this._jobs.push(new_job);
									this.updateJobs();
									await this.dump();
								}
								this.updateCurrentJob(jobId);								
							} else {
								vscode.window.showWarningMessage(`Response status was ${response.status}.`);
							}
						}).catch((error: any) => {
							// handle error
							console.log(error);
							vscode.window.showErrorMessage(`Couldn't get job data. Response ${error.message}`);
						}).then(() => {
							// always executed
						});
						break;
					}
			}
		});
	}

	public getJob() {
		if (this._view) {
			this._view.show?.(true); // `show` is not implemented in 1.49 but is for 1.50 insiders
			this._view.webview.postMessage({ type: 'getJob' });
		}
	}

	public updateJobs() {
		if (this._view) {
			console.log("updateJobs()");
			console.log(this._jobs);
			this._view.show?.(true); // `show` is not implemented in 1.49 but is for 1.50 insiders
			this._view.webview.postMessage({ type: 'updateJobs', jobs: this._jobs });
		}
	}

	public updateCurrentJob(jobId: string) {
		if (this._view) {
			console.log("updateCurrentJob()");
			this._view.show?.(true); // `show` is not implemented in 1.49 but is for 1.50 insiders
			this._view.webview.postMessage({ type: 'updateCurrentJob', current: jobId });
		}
	}

	public getData(){
		if (this._data)
			return this._data;
		return null;
	}

	public addJob(output_url: string, msg?: string){
		if (this._view) {
			this._view.show?.(true); // `show` is not implemented in 1.49 but is for 1.50 insiders
			let new_job :any = { type: 'addJob', output_url: output_url};
			if (msg)
				new_job.notifyMsg = msg;
			// this._jobs.push(new_job);
			// here we go
			this._view.webview.postMessage(new_job);
		}
	}

	private async dump(){
		try{
		const d = JSON.stringify(this._jobs);
		fs.writeFileSync(this._recent_path, d);
		} catch (e){
			console.log("Couldn't store data into file");
			console.log(e.message);
		}
	}

	private removeJob(jobId: string){
		const index = this._jobs.indexOf(jobId);
		console.log("removeJob with jobId=", jobId);
		if (index != -1){
			this._jobs.splice(index, 1);
			console.log("removed");
		}
	}

	private job_exists(new_job: any){
		const output_url_list = this._jobs.map((job) => job.output_url);
		const current_output_url = new_job.output_url;
		if (output_url_list.includes(current_output_url))
			return true;
		return false;
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));

		// Do the same for the stylesheet.
		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));

		// Use a nonce to only allow a specific script to be run.
		const nonce = getNonce();

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
				
				<title>Recent Job List</title>
			</head>
			<body>
				<div id="links" class="list-group"></div>
				<button id="add-job-button">Add Job</button>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}


function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

function getUrl(isDev?: boolean) : string{
	if (isDev)
		return "https://vaas-stg.certora.com";
	return "https://prover.certora.com";
}
