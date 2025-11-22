import { h } from "preact";
import type { GateInfo } from "../types";

interface HeaderProps {
    gate: GateInfo;
    remainingCount: number;
}

export const Header = ({ gate, remainingCount }: HeaderProps) => {
    return (
        <header class="lavenderhaze-header">
            <div class="lavenderhaze-title-block">
                <p class="lavenderhaze-eyebrow">Gate tracker</p>
                <h1>{gate.gateName}</h1>
                <p class="lavenderhaze-date">Checking plays on or after {gate.unlockDate.toLocaleDateString()}</p>
            </div>
            <div class="lavenderhaze-meta">
                <div class="lavenderhaze-meta-card">
                    <span class="lavenderhaze-meta-label">Tracked songs</span>
                    <span class="lavenderhaze-meta-value">{gate.songs.length}</span>
                </div>
                <div class="lavenderhaze-meta-card">
                    <span class="lavenderhaze-meta-label">Need to replay</span>
                    <span class="lavenderhaze-meta-value">{remainingCount} song{remainingCount === 1 ? "" : "s"}</span>
                </div>
            </div>
        </header>
    );
};
