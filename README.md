> :warning: **Pre Release**

## FormatD.ComponentLoader

An easy way to load Javascript for fusion components


### Compatibility

Versioning scheme:

     1.0.0 
     | | |
     | | Bugfix Releases (non breaking)
     | Neos Compatibility Releases (non breaking)
     Feature Releases (breaking)

Releases and compatibility:

| Package-Version | Neos CMS Version |
|-----------------|------------------|
| 1.0.x           | 7.x and newer    |


#### Create a component manager:

```typescript
export default class MyComponentManager extends AbstractComponentManager {
	initialize(domSection: HTMLElement) {
		console.log("Hello World")
	}
}
```

#### Include the corresponding files

```typescript
import {componentLoader} from formatd-component-loader;

componentLoader.addDefaultImport('Vendor.Website:MyComponent', () => import('../private/Fusion/MyComponent'));
//...
componentLoader.initialize()
```