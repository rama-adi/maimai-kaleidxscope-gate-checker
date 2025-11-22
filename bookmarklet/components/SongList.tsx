import { h } from "preact";
import type { GateInfo, SongStatusMap } from "../types";

interface SongListProps {
    gate: GateInfo;
    statuses: SongStatusMap;
    currentChecking: string | null;
}

export const SongList = ({ gate, statuses, currentChecking }: SongListProps) => {
    return (
        <section class="m-[0.85rem_1.15rem] bg-white rounded-[18px] border-[3px] border-[#8cc5ff] p-[0.9rem]">
            <p class="m-[0.1rem_0] text-[#37538c] text-[0.82rem]">Below are all songs with their current status. The list updates live while your history is checked.</p>
            <ol id="song-list" class="mt-[0.6rem] pl-0 max-h-[12.5rem] overflow-auto list-none">
                {gate.songs.map(title => {
                    const status = statuses.get(title) ?? "unplayed";
                    const isActive = title === currentChecking;
                    const icon = isActive ? "➡️" : status === "completed" ? "✅" : "☆";
                    const tagText = isActive ? "Checking" : status === "completed" ? "Played" : "Needs play";

                    let itemClasses = "flex items-center gap-[0.55rem] p-[0.35rem_0.4rem] mb-[0.25rem] rounded-2xl border-2 border-dashed border-transparent bg-[#f3f8ff]";
                    if (isActive) {
                        itemClasses += " border-[#ffaf00] bg-[#fff4da]";
                    } else if (status === "completed") {
                        itemClasses += " bg-[#ebffe7] border-[#7dcf62]";
                    }

                    return (
                        <li class={itemClasses} key={title}>
                            <span class="w-[2rem] h-[2rem] rounded-full flex items-center justify-center text-[1rem] bg-white border-2 border-[#0e3c6e]" aria-hidden="true">{icon}</span>
                            <div class="flex flex-col gap-[0.12rem] flex-1">
                                <span class="font-bold text-[#122c63] text-[0.9rem]">{title}</span>
                                <span class="text-[0.7rem] tracking-[0.08em] uppercase">{tagText}</span>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
};
