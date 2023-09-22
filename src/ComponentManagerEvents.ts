import { ReloadReason } from "./AbstractComponentManager";

export type ComponentManagerEventDetail = { domSection: HTMLElement | Document, reason: ReloadReason }

export class ComponentManagerLoadEvent extends CustomEvent<ComponentManagerEventDetail> {
    constructor(key: string, domSection: HTMLElement | Document, reason: ReloadReason) {
        super(ComponentManagerLoadEvent.BuildType(key), { detail: { domSection, reason } });
    }

    static BuildType(key: string) {
        return `${key}#load`
    }
}

export class ComponentManagerReloadReasonEvent extends CustomEvent<ComponentManagerEventDetail> {
    constructor(key: string, domSection: HTMLElement | Document, reason: ReloadReason) {
        super(ComponentManagerReloadReasonEvent.BuildType(key, reason), { detail: { domSection, reason } });
    }

    static BuildType(key: string, reason: ReloadReason) {
        return `${key}%${reason}`
    }
}

export class ComponentManagerRegisterEvent extends CustomEvent<ComponentManagerEventDetail> {
    constructor(key: string, domSection: HTMLElement | Document, reason: ReloadReason) {
        super(ComponentManagerRegisterEvent.BuildType(key), { detail: { domSection, reason } });
    }

    static BuildType(key: string) {
        return `${key}#$register`
    }
}


export interface ComponentManagerRegisterEventListener extends EventListener {
    (evt: ComponentManagerRegisterEvent): Promise<void>
}

export interface ComponentManagerReloadReasonEventListener extends EventListener {
    (evt: ComponentManagerReloadReasonEvent): Promise<void>
}

export interface ComponentManagerLoadEventListener extends EventListener {
    (evt: ComponentManagerLoadEvent): Promise<void>
} 
