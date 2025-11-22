import { FAVORITES_HOST, FAVORITES_PATH, FAVORITES_URL, GATE_DEFINITIONS, type GateId } from "../constants";
import type { GateInfo, SongStatusMap } from "../types";

export function ensureOnFavoritesPage(): boolean {
    const { hostname, pathname } = window.location;
    if (hostname === FAVORITES_HOST && pathname === FAVORITES_PATH) return true;

    const go = confirm("This bookmarklet should be run on the music favorite list page, do you want to go there and rerun the script");
    if (go) window.location.href = FAVORITES_URL;
    return false;
}

export function promptForGateSelection(): GateId | null {
    const gateOptions = Object.keys(GATE_DEFINITIONS) as GateId[];
    const selection = prompt([
        "Please type the gate that you want to check.",
        "",
        `available options are: ${gateOptions.join("/")}`,
        "",
        "Note:",
        "- This is only for gates that needed songs to be played at least once on their release date, for other gates, this is not the tool.",
        "- Make sure your favorite slot is sufficient. recommend to close this prompt and clear out some space on your favorites first, and then rerun."
    ].join("\n"));

    const normalized = (selection || "").trim().toLowerCase();
    if (!normalized || !isGateId(normalized)) {
        alert(`Invalid gate selection. Please enter one of: ${gateOptions.join(", ")}.`);
        return null;
    }

    return normalized;
}

export function isGateId(value: string): value is GateId {
    return Object.prototype.hasOwnProperty.call(GATE_DEFINITIONS, value);
}

export function initializeSongStatuses(gate: GateInfo): SongStatusMap {
    const statuses = new Map<string, "unplayed" | "completed">();
    gate.songs.forEach(title => statuses.set(title, "unplayed"));
    return statuses;
}

export function getUnplayedTitles(gate: GateInfo, statuses: SongStatusMap) {
    return gate.songs.filter(title => statuses.get(title) === "unplayed");
}

export function handleAddToFavorites(gate: GateInfo, statuses: SongStatusMap, onClose: () => void) {
    const remaining = getUnplayedTitles(gate, statuses);
    if (!remaining.length) {
        alert("All songs have already been played since the gate opened!");
        return;
    }

    document.querySelectorAll<HTMLElement>(".favorite_checkbox_frame.m_10").forEach(node => {
        if (remaining.some(song => node.innerText.includes(song))) node.click();
    });

    alert("Songs are checked, now you just need to save them :-)");
    onClose();
}
