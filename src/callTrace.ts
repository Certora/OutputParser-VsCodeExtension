import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class CallTraceProvider implements vscode.TreeDataProvider<CallTraceItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<CallTraceItem | undefined | void> = new vscode.EventEmitter<CallTraceItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<CallTraceItem | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private data: any) {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: CallTraceItem): CallTraceItem {
		// console.log("CallTraceProvider: getTreeItem");
		// console.log(element);
		return element;
	}
	
	getChildren(element?: CallTraceItem): CallTraceItem[] {
		// console.log("CallTraceProvider: getChildren");
		// console.log(element);
		let CallTraceItems: CallTraceItem[] = [];

		if (!this.data) {
			// vscode.window.showWarningMessage('No data...');
			return CallTraceItems;
		}

		if (element){
  
			if (element.childrenList && element.childrenList.length > 0) {
				for (var i = 0; i < element.childrenList.length; i++ ) {                             
					CallTraceItems[i] = new CallTraceItem(element.childrenList[i].funcName,
						element.childrenList[i].childrenList, 
						element.childrenList[i].childrenList && element.childrenList[i].childrenList.length > 0 ?
						vscode.TreeItemCollapsibleState.Collapsed
						: vscode.TreeItemCollapsibleState.None,
						element.childrenList[i].returnValue);
				}
			}
			return CallTraceItems;
		}else {
			// vscode.window.showInformationMessage('Empty element...');
			//return Promise.resolve([]);
			return this.getProperties();
		}
	}

	getProperties(element?: any){
		// console.log("here");
		// console.log(element);
		if (!this.data){
			return [];
		}
		if (element){
			//return element.childrenList && element.childrenList.length > 0 ? element.childrenList : [];
			element.childrenList ? element.childrenList.map(child => {
				// console.log("child");
				// console.log(child);
				// console.log(child.childrenList);
				return new CallTraceItem(
					child.funcName, 
					child.childrenList, 
					child.childrenList && child.childrenList.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
					child.returnValue
					)
			})
			: [];
			return element.childrenList;
		} else {
			const currentElem = this.data;
			// console.log(currentElem);
			return [new CallTraceItem(currentElem.funcName, 
				currentElem.childrenList, 
				currentElem.childrenList && currentElem.childrenList.length > 0 ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None,
				currentElem.returnValue)];
		}
	}

}

export class CallTraceItem extends vscode.TreeItem {

	constructor(
		public readonly name: string,
		public childrenList: any[],
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly returnValue: string
	) {
		super(name, collapsibleState);

		this.tooltip = `${this.name}`;
		this.description = `${this.returnValue}`;
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
	};

	contextValue = 'callTrace';
}
