
export enum EventTypes {
    Reload = 'fdds.evaluateJs',
    ReloadModal = 'fdds.evaluateJsModal',
    ReloadBackend = 'Neos.NodeCreated'
}

export class ComponentLoaderEvent extends CustomEvent<{ domSection: HTMLElement | Document }> {
    constructor(type: string, domSection: HTMLElement | Document) {
        super(type, { detail: { domSection } });
    }
}

export class ComponentLoaderReloadEvent extends ComponentLoaderEvent {
    constructor(domSection: HTMLElement | Document) {
        super(EventTypes.Reload, domSection);
    }
}

export class ComponentLoaderModalReloadEvent extends ComponentLoaderEvent {
    constructor(domSection: HTMLElement | Document) {
        super(EventTypes.ReloadModal, domSection);
    }
}