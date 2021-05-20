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
		this._recent_path = certora_path + "/recent_jobs.json";
		try {
			const jobs = JSON.parse(fs.readFileSync(this._recent_path, 'utf-8'));
			console.log("recent jobs");
			jobs.forEach((job: any) => {
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
			let data_url: string;
			// console.log(data);

			switch (data.type) {
				case 'addJob':
					{
						vscode.commands.executeCommand('recent.addJob');
						break;
					}
				case 'jobSelected':
					{
						console.log(data.value);
						console.log(process.env.CERTORAKEY);
						vscode.window.showInformationMessage(`Searching for job with id=${data.value}`);
						const isDev = data.dev;
						data_url = `${getUrl(isDev)}/jobsData`;
						axios.get(data_url, 
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
										if (found_job.jobStatus == "SUCCEEDED" || found_job.jobStatus == "FAILED"){
											data_url = `${found_job.outputUrl}data.json?anonymousKey=${found_job.anonymousKey}`;
											if(found_job.jobStatus == "FAILED") // job finished running
												vscode.window.showWarningMessage(`Request job status is ${found_job.jobStatus}. The output may be missing.`);
											
										} else{
											vscode.window.showWarningMessage(`Request job status is ${found_job.jobStatus}`);
										}
									} else if(d.missingOutput.length > 0){  // requested job is missing the output
										console.log("Missing");
										vscode.window.showErrorMessage(`Couldn't find the job`);
									}
								} else {
									console.log(d.errorString);
									vscode.window.showErrorMessage(`Couldn't get job data. ${d.errorString}`);
								}
							} else {
								vscode.window.showErrorMessage(`Couldn't get job data. Response status code was ${resp.status}`);
								console.log("ERROR. status code is " + resp.status);
							}
						}).catch((error: any) => {
							// handle error
							console.log(error);
							vscode.window.showErrorMessage(`Couldn't get job data. Response ${error.message}`);
						}).then(() => {
							// always executed
							console.log("the always part");
							if (data_url){
								vscode.window.showInformationMessage(`Gettings job results...`);
								axios.get(data_url).then( (response: any) => {
									// handle success
									console.log(response);
									this._data = response.data;
									vscode.window.showInformationMessage(`Successfullly retrieved job results.`);
									vscode.commands.executeCommand('specOutline.refresh', this.getData());
								}).catch( (error: any) => {
									// handle error
									console.log(error);
									vscode.window.showErrorMessage(`Couldn't get job results. Response status code was ${error.message}`);
								}).then(function () {
									// always executed
								});
							} else {
								console.log("Empty data url");
							}
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

	public getData(){
		if (this._data)
			return this._data;
		return null;
	}

	public addJob(jobId: string, isDev?: Boolean){
		if (this._view) {
			this._view.show?.(true); // `show` is not implemented in 1.49 but is for 1.50 insiders
			let new_job :any = { type: 'addJob', id: jobId};
			if (isDev)
				new_job.isDev = true;
			this._jobs.push(new_job);
			this._view.webview.postMessage(new_job);
		}
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
