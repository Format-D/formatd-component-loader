import { type DomSection } from "./ComponentLoader"

export enum ReloadReason {
    Ready = 'ready',
    Reload = 'reload',
    BackendReload = 'reload_backend',
    ModalReload = 'reload_modal'
}

export abstract class AbstractComponentManager {

    abstract initialize(domSection: DomSection): void

    async reload(domSection: DomSection) {
        return this.initialize(domSection)
    }

    async backendReload(domSection: DomSection) {
        return this.reload(domSection)
    }

    async modalReload(domSection: DomSection) {
        return this.reload(domSection)
    }

    async load(domSection: DomSection, reason: ReloadReason) {
        switch (reason) {
            case ReloadReason.Ready: return this.initialize(domSection)
            case ReloadReason.Reload: return this.reload(domSection)
            case ReloadReason.BackendReload: return this.backendReload(domSection)
            case ReloadReason.ModalReload: return this.modalReload(domSection)
        }
    }
}