import { h } from "preact";
import type { GateInfo, SongStatusMap } from "../types";
import { useSongChecker } from "../hooks/useSongChecker";
import { handleAddToFavorites } from "../utils/dom";
import { Header } from "./Header";
import { SongList } from "./SongList";
import { StatusPanel } from "./StatusPanel";
import { STYLES } from "./styles";

interface AppProps {
    gate: GateInfo;
    initialStatuses: SongStatusMap;
    onClose: () => void;
}

export const App = ({ gate, initialStatuses, onClose }: AppProps) => {
    const {
        statuses,
        logs,
        statusMessage,
        currentChecking,
        isFinished,
        remainingCount
    } = useSongChecker(gate, initialStatuses);

    return (
        <div class="lavenderhaze-window">
            <style>{STYLES}</style>
            <Header gate={gate} remainingCount={remainingCount} />
            <SongList gate={gate} statuses={statuses} currentChecking={currentChecking} />
            <StatusPanel statusMessage={statusMessage} logs={logs} />
            <div class="lavenderhaze-footer">
                <span>Made by Onebyte</span>
                <a href="https://github.com/rama-adi" target="_blank" rel="noopener noreferrer">github.com/rama-adi</a>
            </div>
            {isFinished && (
                <div class="btn-row lavenderhaze-actions">
                    <button class="btn-light" onClick={onClose}>Close</button>
                    <button class="btn-dark" onClick={() => handleAddToFavorites(gate, statuses, onClose)}>Add to favorites</button>
                </div>
            )}
        </div>
    );
};
