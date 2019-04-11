import { OverlayContainer } from '@angular/cdk/overlay';
import { Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export class OutletOverlayContainer extends OverlayContainer {
    private _parentElement: Element;

    constructor(@Inject(DOCUMENT) _document?: any) {
        super(_document);
    }

    public get parentElement(): Element {
        return this._parentElement;
    }
    public set parentElement(value: Element) {
        if (this._parentElement === value) {
            return;
        }
        this._parentElement = value;
        if (this._containerElement && this._containerElement.parentNode) {
            this._containerElement.parentNode.removeChild(this._containerElement);
        }
        this._containerElement = null;
    }

    _createContainer(): void {
        if (this.parentElement) {
            const container = document.createElement('div');
            container.classList.add('app-overlay-container');
            this.parentElement.appendChild(container);
            this._containerElement = container;
        } else {
            super._createContainer();
        }
    }
}


