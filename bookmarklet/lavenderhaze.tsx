import "./main.css";
import { render, h } from "preact";
import { GATE_DEFINITIONS } from "./constants";
import { ensureOnFavoritesPage, promptForGateSelection, initializeSongStatuses } from "./utils/dom";
import { App } from "./components/App";
import { createModalContainer } from "./utils/injection";

function bookmarklet() {
    if (!ensureOnFavoritesPage()) return;
    const gateId = promptForGateSelection();
    if (!gateId) return;

    const gate = GATE_DEFINITIONS[gateId];
    const initialStatuses = initializeSongStatuses(gate);

    const container = createModalContainer();
    if (!container) return;

    const { modalRoot, remove } = container;

    render(<App gate={gate} initialStatuses={initialStatuses} onClose={remove} />, modalRoot);
}

bookmarklet();
