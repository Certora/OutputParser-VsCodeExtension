import * as vscode from 'vscode';
import * as path from 'path';

export class AvailableContractsProvider implements vscode.TreeDataProvider<AvailableContractsItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<AvailableContractsItem | undefined | void> = new vscode.EventEmitter<AvailableContractsItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<AvailableContractsItem | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private data: any) {
	}

	refresh(data: any): void {
		console.log("Refreshed the available contracts");
		this.data = data;
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: AvailableContractsItem): AvailableContractsItem {
		// console.log("AvailableContracts: getTreeItem()");
		// console.log(element);
		const iconPath = this.getIcon(element);
		if (iconPath)
			element.iconPath = iconPath;
		return element;
	}
	
	getChildren(element?: AvailableContractsItem): AvailableContractsItem[] {
		// console.log("AvailableContracts: getChildren()");
		// console.log(element);
		let AvailableContractsItems: AvailableContractsItem[] = [];

		if (!this.data) {
			vscode.window.showWarningMessage('No data...');
			return AvailableContractsItems;
		}

		if (element){
  
			/*if (element.methodsNames && element.methodsNames.length > 0) {
				//return element.methodsNames;
				for (var i = 0; i < element.methodsNames.length; i++ ) {                             
					AvailableContractsItems[i] = new AvailableContractsItem(
						element.methodsNames[i].name,
						[],
						vscode.TreeItemCollapsibleState.None, 
						""
						);
				}
			}*/
			return element.methodsNames;//AvailableContractsItems;
		}else {
			// vscode.window.showInformationMessage('Empty element...');
			//return Promise.resolve([]);
			return this.getAvailableContracts();
		}
	}

	getAvailableContracts(element?: any) : AvailableContractsItem[] {
		// console.log("here");
		// console.log(element);
		if (!this.data){
			return [];
		}
		const helpFunc = (contractData: any): AvailableContractsItem => {
			const currentRow = contractData.tableRow;
			//if (currentRow.methodsNames.length > 0 || currentRow.pre_state) { // show the children		
				const children = currentRow.methodsNames;
				// console.log("children:");
				// console.log(children);
				
				return new AvailableContractsItem(
					currentRow.name, 
					this.getMethods(currentRow), 
					vscode.TreeItemCollapsibleState.Collapsed,
					currentRow.address
				);
			//}
		};
		if (element){
			//return element.childrenList && element.childrenList.length > 0 ? element.childrenList : [];
			/*element.childrenList ? element.childrenList.map((child: any) => {
				console.log("child");
				console.log(child);
				console.log(child.childrenList);
				return new AvailableContractsItem(
					child.funcName, 
					child.childrenList, 
					child.childrenList && child.childrenList.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
					child.result
					)
			})
			: [];*/
			return element.methodsNames;
		} else {
			let availableContractsData = this.data.availableContractsTable.contractResult;
			if (availableContractsData){
				return availableContractsData.map((contractData: any) => helpFunc(contractData));
			} else {
				return [];		
			}
		}
	}

	getMethods(contractData?: any) : AvailableContractsItem[] {
		// console.log("getMethods");
		// console.log(contractData);
		if (contractData){
			const stringListMethods = contractData.methodsNames;
			const listMethods = stringListMethods.map((methodName: string) => {
				return new AvailableContractsItem(
					methodName, 
					[], 
					vscode.TreeItemCollapsibleState.None
				);
			});
			const pre_state = contractData.pre_state;		
			listMethods.push(new AvailableContractsItem(
				pre_state, 
				[], 
				vscode.TreeItemCollapsibleState.None,
				""
			));
			// console.log(listMethods);
			return listMethods;
		}
		return [];
	}

	private getIcon(element: AvailableContractsItem): any {
		if (element.methodsNames && element.methodsNames.length > 0) {
			return {
				light: path.join(__filename, '..', '..', 'resources', 'light', 'document.svg'),
				dark: path.join(__filename, '..', '..', 'resources', 'dark', 'document.svg')
			};
		}
		/* else {
			return {
				light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
				dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
			};
		}*/
		return null;
	}
}

export class AvailableContractsItem extends vscode.TreeItem {

	constructor(
		public readonly name: string,
		public methodsNames: AvailableContractsItem[],
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly address?: string
	) {
		super(name, collapsibleState);
		//this.resourceUri = vscode.workspace.workspaceFolders[0].uri;
		this.tooltip = `${this.name}`;
		this.description = this.address ? `address: ${this.address}` : ``;
	}

	/*iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
	};*/

	contextValue = 'availableContracts';
}
