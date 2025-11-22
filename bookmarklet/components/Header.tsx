import "../main.css";
import { h } from "preact";
import type { GateInfo } from "../types";

interface HeaderProps {
    gate: GateInfo;
    remainingCount: number;
}

export const Header = ({ gate, remainingCount }: HeaderProps) => {
    return (
        <header class="p-[1rem_1.2rem] border-b-[3px] border-[#bedfff] flex flex-col gap-3">
            <div class="flex flex-col gap-[0.05rem]">
                <p class="m-0 uppercase text-[0.7rem] tracking-[0.15em] text-[#4f7dc9] font-bold">Gate tracker</p>
                <h1 class="mt-[0.05rem] mb-0 text-[1.25rem] text-[#0f2f63]">{gate.gateName}</h1>
                <p class="mt-[0.2rem] mb-0 text-[0.8rem] text-[#4a5d9b]">Checking plays on or after {gate.unlockDate.toLocaleDateString()}</p>
            </div>
            <div class="flex gap-2 flex-wrap">
                <div class="flex-1 basis-[120px] bg-white rounded-2xl border-2 border-[#8cc5ff] p-[0.45rem_0.6rem] flex flex-col">
                    <span class="text-[0.68rem] text-[#4f678e] uppercase tracking-[0.08em]">Tracked songs</span>
                    <span class="text-[1.15rem] font-bold text-[#0f2f63]">{gate.songs.length}</span>
                </div>
                <div class="flex-1 basis-[120px] bg-white rounded-2xl border-2 border-[#8cc5ff] p-[0.45rem_0.6rem] flex flex-col">
                    <span class="text-[0.68rem] text-[#4f678e] uppercase tracking-[0.08em]">Need to replay</span>
                    <span class="text-[1.15rem] font-bold text-[#0f2f63]">{remainingCount} song{remainingCount === 1 ? "" : "s"}</span>
                </div>
            </div>
        </header>
    );
};
