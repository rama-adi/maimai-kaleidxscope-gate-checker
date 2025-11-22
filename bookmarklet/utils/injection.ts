import { render, h, type ComponentChild } from "preact";

/**
 * Injects a shadow DOM container adjacent to the target element.
 * @param targetElement The element to inject next to.
 * @returns The shadow root of the injected container.
 */
export function injectShadowContainer(targetElement: Element): ShadowRoot {
    const shadowHost = document.createElement('div');
    targetElement.parentNode?.insertBefore(shadowHost, targetElement.nextSibling);
    return shadowHost.attachShadow({ mode: 'open' });
}

/**
 * Injects a Preact component into a shadow DOM container targeted by a selector.
 * @param selector The CSS selector to find the target element.
 * @param component The Preact component to render.
 * @returns True if injection was successful, false otherwise.
 */
export function injectComponent(selector: string, component: ComponentChild): boolean {
    const el = document.querySelector(selector);
    if (!el) return false;

    const shadowRoot = injectShadowContainer(el);
    const container = document.createElement('div');
    shadowRoot.appendChild(container);
    render(component, container);
    return true;
}

/**
 * Creates a modal container in the shadow DOM attached to the body.
 * @returns An object containing the modal root element and a remove function.
 */
export function createModalContainer(): { modalRoot: HTMLElement, remove: () => void } | null {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: "open" });

    const container = document.createElement("div");
    container.id = "backdrop";
    container.innerHTML = '<div id="modal"></div>';
    shadow.appendChild(container);

    const modalRoot = container.querySelector<HTMLElement>("#modal");
    if (!modalRoot) {
        host.remove();
        return null;
    }

    return {
        modalRoot,
        remove: () => {
            render(null, modalRoot);
            host.remove();
        }
    };
}
