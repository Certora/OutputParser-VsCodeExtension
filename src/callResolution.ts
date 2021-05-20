import * as vscode from 'vscode';
import * as path from 'path';

export class CallResolutionProvider implements vscode.TreeDataProvider<CallResolutionItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<CallResolutionItem | undefined | void> = new vscode.EventEmitter<CallResolutionItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<CallResolutionItem | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private data: any) {
	}

	refresh(callResolutionData: any): void {
		console.log("callResolution Refreshed");
		this.data = callResolutionData;
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: CallResolutionItem): CallResolutionItem {
		// console.log("CallResolutionWarningsProvider");
		// console.log(element);
		const iconPath = this.getIcon(element);
		if (iconPath)
			element.iconPath = iconPath;
		return element;
	}
	
	getChildren(element?: CallResolutionItem): CallResolutionItem[] {
		// console.log("CallResolutionWarningsProvider: getChildren");
		// console.log(element);
		let CallResolutionItems: CallResolutionItem[] = [];

		if (!this.data) {
			// vscode.window.showWarningMessage('No data...');
			return CallResolutionItems;
		}

		if (element){
  
			return element.value;//this.getCallResolution(element);
			
		}else {
			// vscode.window.showInformationMessage('Empty element...');
			//return Promise.resolve([]);
			return this.getCallResolution();
		}
	}

	getCallResolution(element?: any){
		// console.log("here");
		// console.log(element);
		if (!this.data){
			return [];
		}
		if (element){
			return element.value ? element.value : [];
		} else {
			const callResolutionWarningList = this.data.map((callResolutionWarning: any) => {
				const d = callResolutionWarning.tableRow;
				// console.log(d);
				return new CallResolutionItem(
					d.caller,
					[
						new CallResolutionItem(
							"callee",
							[new CallResolutionItem(d.callee, [], vscode.TreeItemCollapsibleState.None)],
							vscode.TreeItemCollapsibleState.Collapsed
						),
						new CallResolutionItem(
							"summmary",
							[new CallResolutionItem(d.summmary, [], vscode.TreeItemCollapsibleState.None)],
							vscode.TreeItemCollapsibleState.Collapsed
						),
						new CallResolutionItem(
							"comments",
							d.comments.map((comment: any) => {
								const keys = Object.keys(comment);
								if (keys && keys.length > 0){
									const singleKey = keys[0];
									return new CallResolutionItem(
										singleKey,
										[new CallResolutionItem(comment[singleKey], [], vscode.TreeItemCollapsibleState.None)],
										vscode.TreeItemCollapsibleState.Collapsed
									)
								} else {
									return [];
								}
							}),
							vscode.TreeItemCollapsibleState.Collapsed
						)
					],
					vscode.TreeItemCollapsibleState.Expanded
				);
			});
			return callResolutionWarningList;
		}
	}

	private getIcon(element: CallResolutionItem): any {
		if (element.collapsibleState != vscode.TreeItemCollapsibleState.None) {
			return {
				light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
				dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
			};
		}
		return null;
	}

}

export class CallResolutionItem extends vscode.TreeItem {	
	constructor(
		public readonly name: string,
		public value: CallResolutionItem[],
		public readonly collapsibleState: vscode.TreeItemCollapsibleState
	) {
		super(name, collapsibleState);

		this.tooltip = `${this.name}`;
		//this.description = "no description";
	}

	/*iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
	};*/

	// contextValue = 'callResolution';
}
