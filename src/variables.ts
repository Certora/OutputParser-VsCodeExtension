import * as vscode from 'vscode';
import * as path from 'path';

export class VariablesProvider implements vscode.TreeDataProvider<VariablesItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<VariablesItem | undefined | void> = new vscode.EventEmitter<VariablesItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<VariablesItem | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private data: any) {
	}

	refresh(variablesData: any): void {
		console.log("Refreshed the variables tree");
		this.data = variablesData;
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: VariablesItem): VariablesItem {
		// console.log("VariablesProvider: getTreeItem");
		// console.log(element);
		const iconPath = this.getIcon(element);
		if (iconPath)
			element.iconPath = iconPath;
		return element;
	}
	
	getChildren(element?: VariablesItem): VariablesItem[] {
		// console.log("VariablesProvider: getChildren");
		// console.log(element);
		let CallTraceItems: VariablesItem[] = [];

		if (!this.data) {
			// vscode.window.showWarningMessage('No data...');
			return CallTraceItems;
		}

		if (element){
  
			return this.getVariables(element);
			
		}else {
			// vscode.window.showInformationMessage('Empty element...');
			//return Promise.resolve([]);
			return this.getVariables();
		}
	}

	getVariables(element?: any){
		// console.log("here");
		// console.log(element);
		if (!this.data){
			return [];
		}
		if (element){
			//return element.childrenList && element.childrenList.length > 0 ? element.childrenList : [];
			return element.value ? element.value : [];
		} else {
			const currentElem = this.data;
			// console.log(currentElem);

			let variablesList: VariablesItem[] = [];

			for (let key in currentElem) {
				let value = currentElem[key];
				variablesList.push(
					new VariablesItem(
						key, 
						[
							new VariablesItem(value, [], vscode.TreeItemCollapsibleState.None)
						], 
						vscode.TreeItemCollapsibleState.Collapsed)
				);
			}

			return variablesList;
		}
	}

	/*getParent(element?: VariablesItem): VariablesItem {
		// this function is used for treeview.reveal() call only.
		// TODO: make sure it is defined correctly
		/*if (element){
			element.parent;
		}
		return null;
	}*/

	private getIcon(element: VariablesItem): any {
		if (element.collapsibleState != vscode.TreeItemCollapsibleState.None) {
			return {
				light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
				dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
			};
		}
		return null;
	}

}

export class VariablesItem extends vscode.TreeItem {

	constructor(
		public readonly name: string,
		public value: VariablesItem[],
		public readonly collapsibleState: vscode.TreeItemCollapsibleState
	) {
		super(name, collapsibleState);

		this.tooltip = `${this.name}`;
		//this.description = `${this.returnValue}`;//"no description";
	}

	/*iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
	};*/

	// contextValue = 'variables';
}
