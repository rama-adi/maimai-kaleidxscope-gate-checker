import { render, h } from "preact";
import { GATE_DEFINITIONS } from "./constants";
import { ensureOnFavoritesPage, promptForGateSelection, initializeSongStatuses } from "./utils/dom";
import { App } from "./components/App";

function bookmarklet() {
    if (!ensureOnFavoritesPage()) return;
    const gateId = promptForGateSelection();
    if (!gateId) return;

    const gate = GATE_DEFINITIONS[gateId];
    const initialStatuses = initializeSongStatuses(gate);

    const host = document.createElement("div");
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: "open" });

    // Container for Preact
    const container = document.createElement("div");
    container.id = "backdrop";
    container.innerHTML = '<div id="modal"></div>';
    shadow.appendChild(container);

    const modalRoot = container.querySelector("#modal");
    if (!modalRoot) return;

    const onClose = () => {
        render(null, modalRoot);
        host.remove();
    };

    render(<App gate={gate} initialStatuses={initialStatuses} onClose={onClose} />, modalRoot);
}

bookmarklet();
