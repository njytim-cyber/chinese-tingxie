/**
 * DOM Builder Utility
 * Centralized DOM creation to reduce duplication and improve maintainability
 */

import { ButtonClasses, UIText, CommonStyles, ElementIds, ContainerClasses } from '../constants/ui';

export interface ButtonConfig {
    id?: string;
    className?: string;
    text?: string;
    onClick?: () => void;
    title?: string;
    disabled?: boolean;
    innerHTML?: string;
}

export interface ContainerConfig {
    id?: string;
    className?: string;
    styles?: Partial<CSSStyleDeclaration> | Record<string, string>;
}

/**
 * DOM Builder Class
 * Provides factory methods for common UI elements
 */
export class DOMBuilder {
    /**
     * Create a button element with common configuration
     */
    static createButton(config: ButtonConfig): HTMLButtonElement {
        const button = document.createElement('button');

        if (config.id) button.id = config.id;
        if (config.className) button.className = config.className;
        if (config.text) button.textContent = config.text;
        if (config.innerHTML) button.innerHTML = config.innerHTML;
        if (config.onClick) button.onclick = config.onClick;
        if (config.title) button.title = config.title;
        if (config.disabled !== undefined) button.disabled = config.disabled;

        return button;
    }

    /**
     * Create a container div with common configuration
     */
    static createContainer(config: ContainerConfig = {}): HTMLDivElement {
        const container = document.createElement('div');

        if (config.id) container.id = config.id;
        if (config.className) container.className = config.className;
        if (config.styles) {
            this.applyStyles(container, config.styles);
        }

        return container;
    }

    /**
     * Apply styles to an element
     */
    static applyStyles(
        element: HTMLElement,
        styles: Partial<CSSStyleDeclaration> | Record<string, string>
    ): void {
        Object.assign(element.style, styles);
    }

    /**
     * Convert style object to CSS string
     */
    static stylesToString(styles: Record<string, string>): string {
        return Object.entries(styles)
            .map(([key, value]) => `${this.camelToKebab(key)}: ${value}`)
            .join('; ');
    }

    /**
     * Convert camelCase to kebab-case
     */
    private static camelToKebab(str: string): string {
        return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    }

    /**
     * Create a "Continue" button (used in dictation and xizi modes)
     */
    static createContinueButton(
        id: string,
        onClick: () => void,
        className: string = ButtonClasses.PRIMARY
    ): HTMLButtonElement {
        return this.createButton({
            id,
            className,
            innerHTML: UIText.CONTINUE,
            onClick,
        });
    }

    /**
     * Create a continue button container (DRY for dictation, xizi, etc.)
     */
    static createContinueButtonContainer(
        containerId: string,
        buttonId: string,
        onClick: () => void,
        className: string = ButtonClasses.PRIMARY
    ): { container: HTMLDivElement; button: HTMLButtonElement } {
        const container = this.createContainer({
            id: containerId,
            className: ContainerClasses.NEXT_CHUNK,
            styles: CommonStyles.NEXT_BUTTON_CONTAINER,
        });

        const button = this.createContinueButton(buttonId, onClick, className);
        this.applyStyles(button, {
            ...CommonStyles.NEXT_BUTTON,
            display: 'none', // Hidden by default
        });

        container.appendChild(button);

        return { container, button };
    }

    /**
     * Remove element by ID if it exists
     */
    static removeElementById(id: string): void {
        const element = document.getElementById(id);
        if (element) element.remove();
    }

    /**
     * Remove elements by selector
     */
    static removeElements(selector: string, parent: HTMLElement | Document = document): void {
        const elements = parent.querySelectorAll(selector);
        elements.forEach(el => el.remove());
    }

    /**
     * Show/hide element by ID
     */
    static toggleElement(id: string, show: boolean): void {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * Create a modal overlay structure
     */
    static createModal(content: string | HTMLElement): HTMLDivElement {
        const overlay = this.createContainer({
            className: `${ContainerClasses.MODAL_OVERLAY} show`,
        });

        const modalContent = this.createContainer({
            className: ContainerClasses.MODAL_CONTENT,
        });

        if (typeof content === 'string') {
            modalContent.innerHTML = content;
        } else {
            modalContent.appendChild(content);
        }

        overlay.appendChild(modalContent);

        return overlay;
    }

    /**
     * Create SVG icon for buttons
     */
    static createSVGIcon(pathData: string, viewBox: string = '0 0 24 24'): SVGElement {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', viewBox);
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');

        svg.innerHTML = pathData;

        return svg;
    }
}
