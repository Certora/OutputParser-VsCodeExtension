# Views & View Containers

This package provides following views

- Spec outline view
- Available contracts view
- Call trace view
- Variables view
- Call resolution warnings view

The last three are included in a new container view called detailed information


## Running the Package

- Copy certora-output-parser-{version}.vsix file into your current working directory
- Run `code --install-extension certora-output-parser-{version}.vsix`


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


