import * as vscode from 'vscode';
import * as path from 'path';

export class CallResolutionWarningsProvider implements vscode.TreeDataProvider<CallResolutionWarningsItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<CallResolutionWarningsItem | undefined | void> = new vscode.EventEmitter<CallResolutionWarningsItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<CallResolutionWarningsItem | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private data: any) {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: CallResolutionWarningsItem): CallResolutionWarningsItem {
		// console.log("CallResolutionWarningsProvider");
		// console.log(element);
		return element;
	}
	
	getChildren(element?: CallResolutionWarningsItem): CallResolutionWarningsItem[] {
		// console.log("CallResolutionWarningsProvider: getChildren");
		// console.log(element);
		let CallResolutionWarningsItems: CallResolutionWarningsItem[] = [];

		if (!this.data) {
			// vscode.window.showWarningMessage('No data...');
			return CallResolutionWarningsItems;
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
				return new CallResolutionWarningsItem(
					d.caller,
					[
						new CallResolutionWarningsItem(
							"callee",
							[new CallResolutionWarningsItem(d.callee, [], vscode.TreeItemCollapsibleState.None)],
							vscode.TreeItemCollapsibleState.Collapsed
						),
						new CallResolutionWarningsItem(
							"summmary",
							[new CallResolutionWarningsItem(d.summmary, [], vscode.TreeItemCollapsibleState.None)],
							vscode.TreeItemCollapsibleState.Collapsed
						),
						new CallResolutionWarningsItem(
							"comments",
							d.comments.map((comment: any) => {
								const keys = Object.keys(comment);
								if (keys && keys.length > 0){
									const singleKey = keys[0];
									return new CallResolutionWarningsItem(
										singleKey,
										[new CallResolutionWarningsItem(comment[singleKey], [], vscode.TreeItemCollapsibleState.None)],
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

}

export class CallResolutionWarningsItem extends vscode.TreeItem {
	// structure:
	/*
	callResolutionWarnnings = [{tableRow:{
		"key": "val",
		...,
		"comments" : [{"k", "v"},...]

	}},...]

	==>
	callResolutionWarnings:
	> caller value
		> callee
			> callee value
		> summary
			> summary value
		> comments
			> comment1key
				> comment1value
			> comment2key
				> comment2value
			...

	*/	
	
	constructor(
		public readonly name: string,
		public value: CallResolutionWarningsItem[],
		public readonly collapsibleState: vscode.TreeItemCollapsibleState
	) {
		super(name, collapsibleState);

		this.tooltip = `${this.name}`;
		//this.description = "no description";
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
	};

	contextValue = 'callResolutionWarnings';
}
