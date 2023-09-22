import { AbstractComponentManager, ReloadReason } from "./AbstractComponentManager";
import {
	ComponentManagerLoadEvent, ComponentManagerLoadEventListener,
	ComponentManagerReloadReasonEvent, ComponentManagerReloadReasonEventListener
} from "./ComponentManagerEvents";
import {
	EventTypes
} from "./Events";
import LegacyComponentManager from "./LegacyComponentManager";

export type DomSection = Document | HTMLElement
export type LoadHandler = (domSection: DomSection, reason: ReloadReason) => Promise<void>
export type InitializeCallback = (domSection: DomSection, reason: ReloadReason) => Promise<any>
export interface ConditionalImport {
	keys: string[]
	check: () => boolean
}

declare global {
	interface Window {
		__ComponentLoaderComponentRegistry: {
			register: (...componentKeys: string[]) => void,
			components: string[]
		}
		readonly fdds: {
			Context: {
				isBackend: () => boolean
				isDevelopment: boolean
				isProduction: boolean
			}
		}
	}
}


export class ComponentLoader {
	protected loads: { [key: string]: LoadHandler } = {}
	protected componentInstances: { [key: string]: AbstractComponentManager } = {}
	protected alreadyLoaded: string[] = [];
	protected eventTarget = new EventTarget()
	protected conditionalRegisters: ConditionalImport[] = []

	async initialize(onInitializeCallback: InitializeCallback = async () => { }) {
		const log = (...args: unknown[]) => console.log("ComponentLoader: ", ...args)

		for (const conditionalRegister of this.conditionalRegisters) {
			if (conditionalRegister.check()) {
				window.__ComponentLoaderComponentRegistry.register(...conditionalRegister.keys)
			}
		}

		await ComponentLoader.ListenOnInitializeReady(async () => {
			await this.load(window.__ComponentLoaderComponentRegistry.components, document, ReloadReason.Ready);
			await onInitializeCallback(document, ReloadReason.Ready);
		});

		ComponentLoader.ListenOnInitializeReload(async (event: any) => {
			this.initializeComponentsByDataAttribute(event.detail.domSection)
			await this.load(window.__ComponentLoaderComponentRegistry.components, event.detail.domSection, ReloadReason.Reload, true);
			await onInitializeCallback(event.detail.domSection, ReloadReason.Reload);
		});

		ComponentLoader.ListenOnInitializeModalReload(async (event: any) => {
			this.initializeComponentsByDataAttribute(event.detail.domSection)
			await this.load(window.__ComponentLoaderComponentRegistry.components, event.detail.domSection, ReloadReason.ModalReload, true);
			await onInitializeCallback(event.detail.domSection, ReloadReason.ModalReload);
		})

		ComponentLoader.ListenOnInitializeBackendReload(async (event: any) => {
			log("on reload backend", event)
			// Re-init js of jsEnabledComponent if one is inserted
			// When Elements are inserted or removed from a JsEnabled Component that is a ContentCollection an Aspect triggers a complete page reload instead
			this.initializeComponentsByDataAttribute(event.detail.element)

			await this.load(window.__ComponentLoaderComponentRegistry.components, event.detail.element, ReloadReason.BackendReload, true);
			await onInitializeCallback(event.detail.element, ReloadReason.BackendReload);
		});
	}

	initializeComponentsByDataAttribute(domSection: Document | HTMLElement) {
		for (const scriptElement of Array.from(domSection.querySelectorAll('script'))) {
			if ((scriptElement.dataset.registerComponent?.length ?? 0) > 0 && scriptElement.dataset.registerComponent) {
				window.__ComponentLoaderComponentRegistry.register(scriptElement.dataset.registerComponent)
			}
		}
	}

	add(key: string, loadHandler: LoadHandler) {
		this.loads[key] = loadHandler
	}

	resolveInstance(key: string, importedModule: { default: unknown }) {
		if (!(key in this.componentInstances)) {
			if (importedModule.default === undefined) {
				throw new Error(`No default export found trying to import component [${key}]`)
			}
			this.componentInstances[key] = ComponentLoader.ResolveDefaultImportManager(importedModule.default, key)
		}
		return this.componentInstances[key]
	}

	addDefaultImport(key: string, importer: () => Promise<any>) {
		this.add(key, async (domSection: DomSection, reason: ReloadReason) => {
			const imported = await importer()
			const instance = this.resolveInstance(key, imported)
			await instance.load(domSection, reason)
		})
	}

	addConditionalRegister(check: () => boolean, keys: string | string[]) {
		if (typeof keys === 'string') {
			keys = [keys]
		}

		this.conditionalRegisters.push({
			keys,
			check
		})
	}

	async load(keys: string | string[], domSection: Document | HTMLElement, reason: ReloadReason, forceReload: boolean = false) {
		if (forceReload) {
			this.alreadyLoaded = []
		}

		if (typeof keys === 'string') {
			keys = [keys]
		}

		for (const key of keys) {
			if (this.alreadyLoaded.includes(key)) {
				continue;
			}
			if (Object.keys(this.loads).includes(key)) {
				await this.loads[key](domSection, reason);
				this.eventTarget.dispatchEvent(new ComponentManagerReloadReasonEvent(key, domSection, reason))
				this.eventTarget.dispatchEvent(new ComponentManagerLoadEvent(key, domSection, reason))
				this.alreadyLoaded.push(key);
			} else {
				console.warn("FormatD_Loader: Failed to load unregistered item: " + key)
			}
		}
	}

	onLoad(key: string, listener: ComponentManagerLoadEventListener) {
		this.eventTarget.addEventListener(ComponentManagerLoadEvent.BuildType(key), listener)
	}

	removeOnLoadListener(key: string, reason: ReloadReason, listener: ComponentManagerReloadReasonEventListener) {
		this.eventTarget.removeEventListener(ComponentManagerLoadEvent.BuildType(key), listener)
	}

	onReloadReason(key: string, reason: ReloadReason, listener: ComponentManagerReloadReasonEventListener) {
		this.eventTarget.addEventListener(ComponentManagerReloadReasonEvent.BuildType(key, reason), listener)
	}

	removeOnReloadReasonListener(key: string, reason: ReloadReason, listener: ComponentManagerReloadReasonEventListener) {
		this.eventTarget.removeEventListener(ComponentManagerReloadReasonEvent.BuildType(key, reason), listener)
	}

	static async ListenOnInitializeReady(listener: () => Promise<void>) {
		const documentAlreadyLoaded = 'attachEvent' in document ? document.readyState === 'complete' : document.readyState !== 'loading'
		if (documentAlreadyLoaded) {
			await listener();
		} else {
			document.addEventListener('DOMContentLoaded', listener);
		}
	}

	static ListenOnInitializeReload(listener: EventListener) {
		document.addEventListener(EventTypes.Reload, listener);
	}

	static ListenOnInitializeModalReload(listener: EventListener) {
		document.addEventListener(EventTypes.ReloadModal, listener);
	}

	static ListenOnInitializeBackendReload(listener: EventListener) {
		if (window.fdds?.Context?.isBackend()) {
			document.addEventListener(EventTypes.ReloadBackend, listener);
		}
	}

	static ResolveDefaultImportManager(defaultExport: any, key: string) {
		if (defaultExport.prototype instanceof AbstractComponentManager) {
			return new defaultExport
		}
		return new LegacyComponentManager(defaultExport, key)
	}
}

export const componentLoader = new ComponentLoader();
