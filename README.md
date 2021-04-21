# Views & View Containers

This package provides following views

- Spec outlin view
- Available contracts view
- Call trace view
- Variables view
- Call resolution warnings view

The last three are included in a new container view called detailed information


## VS Code API

This package uses following contribution points, activation events and APIs

### Contribution Points

- `views`
- `viewsContainers`

### Activation Events

- `workspaceContains:data.json`

### APIs

- `window.createTreeView`
- `window.registerTreeDataProvider`
- `TreeView`
- `TreeDataProvider`



## Running the Package

- Open this example in VS Code Insiders
- `npm install`
- `npm run watch`
- `F5` to start debugging
- Spec outline (list of properties) view is shown in Package explorer view container in Activity bar.
- When click on the property Detailed information view container should be shown (presenting a call trace, variables and a call resolution warnings views).
