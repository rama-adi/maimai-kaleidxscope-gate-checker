import { h } from "preact";
import type { GateInfo, SongStatusMap } from "../types";

interface SongListProps {
    gate: GateInfo;
    statuses: SongStatusMap;
    currentChecking: string | null;
}

export const SongList = ({ gate, statuses, currentChecking }: SongListProps) => {
    return (
        <section class="lavenderhaze-section">
            <p class="lavenderhaze-note">Below are all songs with their current status. The list updates live while your history is checked.</p>
            <ol id="song-list" class="lavenderhaze-song-list">
                {gate.songs.map(title => {
                    const status = statuses.get(title) ?? "unplayed";
                    const isActive = title === currentChecking;
                    const icon = isActive ? "➡️" : status === "completed" ? "✅" : "☆";
                    const tagText = isActive ? "Checking" : status === "completed" ? "Played" : "Needs play";
                    const classes = `lavenderhaze-song ${status}${isActive ? " is-active" : ""}`;
                    return (
                        <li class={classes} key={title}>
                            <span class="lavenderhaze-song-icon" aria-hidden="true">{icon}</span>
                            <div class="lavenderhaze-song-body">
                                <span class="lavenderhaze-song-title">{title}</span>
                                <span class="lavenderhaze-song-tag">{tagText}</span>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
};
