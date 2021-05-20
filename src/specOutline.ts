import * as vscode from 'vscode';
import * as path from 'path';

export class SpecOutlineProvider implements vscode.TreeDataProvider<SpecOutlineItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<SpecOutlineItem | undefined | void> = new vscode.EventEmitter<SpecOutlineItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<SpecOutlineItem | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private data: any) {
	}

	refresh(data: any): void {
		console.log("Refreshed the spec outline");
		this.data = data;
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: SpecOutlineItem): SpecOutlineItem {
		// console.log("getTreeItem");
		// console.log(element);
		return element;
	}
	
	getChildren(element?: SpecOutlineItem): SpecOutlineItem[] {
		// console.log("getChildren");
		// console.log(element);
		let SpecOutlineItems: SpecOutlineItem[] = [];

		if (!this.data) {
			vscode.window.showWarningMessage('No data...');
			return SpecOutlineItems;
		}

		if (element){
  
			if (element.childrenList && element.childrenList.length > 0) {
				return element.childrenList;
				/*for (var i = 0; i < element.childrenList.length; i++ ) {                             
					SpecOutlineItems[i] = new SpecOutlineItem(element.childrenList[i].funcName,
						element.childrenList[i].childrenList, 
						element.childrenList[i].childrenList && element.childrenList[i].childrenList.length > 0 ?
						vscode.TreeItemCollapsibleState.Collapsed
						: vscode.TreeItemCollapsibleState.None);
				}*/
			}
			return SpecOutlineItems;
		}else {
			// vscode.window.showInformationMessage('Empty element...');
			//return Promise.resolve([]);
			return this.getProperties();
		}
	}

	getProperties(element?: any) : SpecOutlineItem[] {
		if (!this.data){
			return [];
		}
		
		if (element){
			//return element.childrenList && element.childrenList.length > 0 ? element.childrenList : [];
			element.childrenList ? element.childrenList.map((child: any) => {
				// console.log("child");
				// console.log(child);
				// console.log(child.childrenList);
				return new SpecOutlineItem(
					child.funcName, 
					child.childrenList, 
					child.childrenList && child.childrenList.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
					child.result
					)
			})
			: [];
			return element.childrenList;
		} else {
			// const contractName = this.data.contractName ? this.data.contractName : "Current Contract";
			let results = this.data.main_table.contractResult;
			let sections = [];
			if (results){
				const failed = this.getResult(results, "FAIL", "Violated", false);
				if (failed)
					sections.push(failed);
				
				const succeeded = this.getResult(results, "SUCCESS", "Verified");
				if (succeeded)
					sections.push(succeeded);
				
				const timeout = this.getResult(results, "TIMEOUT", "Timeout");
				if (timeout)
					sections.push(timeout);

				const skipped = this.getResult(results, "SKIPPED", "Skipped");
				if (skipped)
					sections.push(skipped);
				
				const unknown = this.getResult(results, "", "Unknown");
				if (unknown)
					sections.push(unknown);

				return sections;
			} else {
				return [];		
			}
		}
	}

	getMethods(element?: any) : SpecOutlineItem[] {
		// console.log("getMethods");
		// console.log(element);
		if (element){
			const listMethodsObjects = element.tableBody;
			const listMethods = listMethodsObjects.map((obj: any) => {
				const funcName = obj.tableRow.funcName;
				return new SpecOutlineItem(
					funcName, 
					[], 
					vscode.TreeItemCollapsibleState.None,
					obj.tableRow.result,
					{
						command: 'extension.showDetails',
						title: 'show details',
						arguments: [this.data, funcName, element.ruleName]
					}
				);
			});
			// console.log(listMethods);			
			return listMethods;
		}
		return [];
	}

	private helpFunc(propertyResult: any): SpecOutlineItem {
		const currentRow = propertyResult.tableRow;
		if (propertyResult.isMultiRule) { // show the children		
			const children = this.data.sub_tables.functionResults.find((obj: any) => obj.ruleName === currentRow.ruleName);
			// console.log("children:");
			// console.log(children);
			
			return new SpecOutlineItem(
				currentRow.ruleName, 
				this.getMethods(children), 
				vscode.TreeItemCollapsibleState.Collapsed,
				currentRow.result
			);
		} else { // show the details of a flat properties (or method if parametric rule)
			// console.log("property");
			// console.log(propertyResult);

			return new SpecOutlineItem(
				currentRow.ruleName, 
				[], 
				vscode.TreeItemCollapsibleState.None, 
				currentRow.result,
				{
					command: 'extension.showDetails',
					title: 'show details',
					arguments: [this.data, propertyResult.tableRow.ruleName]
				}
			);
		}
	}

	private getResult(results: any, requiredResult: string, label: string, isCollapsed: boolean = true): SpecOutlineItem | null{
		let properties: any[];
		if (requiredResult === ""){ // Checks for unknown results
			properties = results.filter((obj: any) => !["FAIL","SUCCESS","TIMEOUT","SKIPPED"].includes(obj.tableRow.result));
		} else {
			properties = results.filter((obj: any) => obj.tableRow.result === requiredResult);
		}
		
		// console.log(properties);
		if (properties && properties.length > 0)
			return new SpecOutlineItem(
				label, 
				properties.sort().map((propertyResult: any) => this.helpFunc(propertyResult)), 
				isCollapsed ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.Expanded, 
				`${properties.length}`
			);
		return null;
	}
}

export class SpecOutlineItem extends vscode.TreeItem {

	constructor(
		public readonly name: string,
		public childrenList: any[],
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly result: string,
		public readonly command?: vscode.Command
	) {
		super(name, collapsibleState);

		this.tooltip = `${this.name}`;
		if (this.result)
			this.description = `${this.result}`;//"some description";
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
	};

	contextValue = 'specOutline';
}
