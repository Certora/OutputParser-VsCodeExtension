import * as vscode from 'vscode';

export class CallTraceViewProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'callTrace';

	private _view?: vscode.WebviewView;

	private i : number = 0;

	constructor(
		private readonly _extensionUri: vscode.Uri,
		private _callTrace: { [x: string]: any; }, //: { [key: string]: string, ["childrenList": string] : [] } ,
	) { }

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

		/*webviewView.webview.onDidReceiveMessage(data => {
			switch (data.type) {
				case 'colorSelected':
					{
						vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString(`#${data.value}`));
						break;
					}
			}
		});*/
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
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));

		// Do the same for the stylesheet.
		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));

		// Use a nonce to only allow a specific script to be run.
		const nonce = getNonce();

		const callTrace = this.callTraceItem();
        
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
				
				<title>Call Trace</title>
			</head>
			<body>
                <div>${callTrace}</div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}

	private callTraceItem(d?: any){
		let callTrace = ``;
		if (d == null){
			d = this._callTrace;
		}
        if (d){
            callTrace += `<div class="level">`;
            const children = d.hasOwnProperty("childrenList") ? d["childrenList"] : [];
            
			const name = d.hasOwnProperty('funcName') ? d["funcName"] : "Unknown";
            const returnValue = d.hasOwnProperty('returnValue') ? d["returnValue"] : "";
            const status = d.hasOwnProperty('status') ? d["status"] : "UNKNOWN";

			const txt = `${name}` + (returnValue ? ` / ${returnValue}` : ``);

			const clsName = getClass(status);
			if (children && children.length > 0){
                const div_id = `level-` + this.i.toString();				
				this.i++;
                callTrace += `<a class="call-trace-parent collapsible" title="click to expand" data-target="${div_id}">${txt}`;
				if (status){
					callTrace += ` <span class="badge ${clsName}">${status}</span>`;
				}
				callTrace += `</a>`;
                callTrace += `<div id="${div_id}" class="collapse">`

				for(var j = 0; j < children.length; j++){
					callTrace += this.callTraceItem(children[j]);
				}
				
				callTrace += `</div>`;
            } else {
				callTrace += `<span class="call-trace-child">${txt}`;
				if (status){
					callTrace += ` <span class="badge ${clsName}">${status}</span>`;
				}
				callTrace += `</span>`;
			}

			callTrace += `</div>`;
			
        } else {
			return `Not found`;
		}

		return callTrace;
	}

	refresh(callTraceData: any): void {
		console.log("callTrace Refreshed");
		try{
		this._callTrace = callTraceData;
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