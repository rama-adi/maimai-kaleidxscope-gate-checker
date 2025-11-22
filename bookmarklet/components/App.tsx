import { h } from "preact";
import type { GateInfo, SongStatusMap } from "../types";
import { useSongChecker } from "../hooks/useSongChecker";
import { handleAddToFavorites } from "../utils/dom";
import { Header } from "./Header";
import { SongList } from "./SongList";
import { StatusPanel } from "./StatusPanel";


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
        <>
            <div class="lavender-gradient-bg border-4 border-[#0e3c6e] rounded-3xl shadow-[0_12px_35px_rgba(0,0,0,0.35)] overflow-hidden">
                <Header gate={gate} remainingCount={remainingCount} />
                <SongList gate={gate} statuses={statuses} currentChecking={currentChecking} />
                <StatusPanel statusMessage={statusMessage} logs={logs} />
                <div class="flex justify-between gap-2 m-[0_1.15rem_0.85rem] text-[0.7rem] text-[#4f678e] items-center">
                    <span>Made by Onebyte</span>
                    <a href="https://github.com/rama-adi" target="_blank" rel="noopener noreferrer" class="text-[#3b6fd4] no-underline font-bold">github.com/rama-adi</a>
                </div>
                {isFinished && (
                    <div class="flex gap-3 m-[0_1.15rem_1.15rem]">
                        <button
                            class="flex-1 border-none p-[0.8rem_0.95rem] rounded-[18px] text-[0.9rem] font-bold cursor-pointer transition-transform duration-200 ease-out bg-white border-[3px] border-[#8cc5ff] text-[#1f3f7a] shadow-[0_3px_0_#4c87c1] active:translate-y-[2px] active:shadow-[0_1px_0_rgba(0,0,0,0.25)]"
                            onClick={onClose}
                        >
                            Close
                        </button>
                        <button
                            class="flex-1 border-none p-[0.8rem_0.95rem] rounded-[18px] text-[0.9rem] font-bold cursor-pointer transition-transform duration-200 ease-out lavender-gradient-btn border-[3px] border-[#a3296b] text-white shadow-[0_3px_0_#741a48] active:translate-y-[2px] active:shadow-[0_1px_0_rgba(0,0,0,0.25)]"
                            onClick={() => handleAddToFavorites(gate, statuses, onClose)}
                        >
                            Add to favorites
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};
