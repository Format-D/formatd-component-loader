import { AbstractComponentManager } from "./AbstractComponentManager";

export default class LegacyComponentManager extends AbstractComponentManager {
    protected legacyFunction: (domSection: HTMLElement) => void

    constructor(legacyFunction: (domSection: HTMLElement) => void, key: string) {
        super();
        this.legacyFunction = legacyFunction
        console.warn(`Using LegacyComponentManager for [${key}]`)
    }

    async initialize(domSection: HTMLElement) {
        return this.legacyFunction(domSection)
    }
}