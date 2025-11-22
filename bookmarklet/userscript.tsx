import "./main.css";
import { render, h } from "preact";
import { FAVORITES_HOST, FAVORITES_URL, GATE_DEFINITIONS, SELECTORS } from "./constants";
import { promptForGateSelection, initializeSongStatuses, onFavoritesPage } from "./utils/dom";
import { App } from "./components/App";
import KDXButtonCheck from "./utils/kdx-button";
import { injectComponent, createModalContainer } from "./utils/injection";

function userscript() {
    if (!onFavoritesPage()) {
        const { hostname, pathname } = window.location;
        if (hostname == FAVORITES_HOST && pathname == '/maimai-mobile/home/') {
            injectComponent(
                SELECTORS.NON_FAVORITES_PAGE_TARGET,
                <KDXButtonCheck onClick={() => window.location.href = FAVORITES_URL} />
            );
        }
        return;
    }

    const injectModal = () => {
        const gateId = promptForGateSelection();
        if (!gateId) return;

        const gate = GATE_DEFINITIONS[gateId];
        const initialStatuses = initializeSongStatuses(gate);

        const container = createModalContainer();
        if (!container) return;

        const { modalRoot, remove } = container;

        render(<App gate={gate} initialStatuses={initialStatuses} onClose={remove} />, modalRoot);
    };

    injectComponent(
        SELECTORS.FAVORITES_PAGE_NAV_TARGET,
        <KDXButtonCheck onClick={injectModal} />
    );
}

userscript();
