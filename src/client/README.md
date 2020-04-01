## Directory structure

### `index.js`

This file is the entrypoint for the client-side application. This is where all top-level components are brought
together to scaffold the app.

### `components/`

Contains custom React components used throughout the app. Component code must be purely presentational.

### `services/`

Contains "services" that help execute business logic.

### `studies/`

Contains components used to render a study.

This is where modules from `components` and `services` are brought together to create top-level components.
