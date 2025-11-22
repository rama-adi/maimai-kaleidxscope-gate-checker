import { h } from "preact";

interface StatusPanelProps {
    statusMessage: string;
    logs: string[];
}

export const StatusPanel = ({ statusMessage, logs }: StatusPanelProps) => {
    return (
        <section class="m-[0_1.15rem_0.85rem] p-[0.85rem] bg-white rounded-[18px] border-[3px] border-[#f6b4ff]">
            <p class="m-[0_0_0.45rem] font-bold text-[#511f99]">{statusMessage}</p>
            <div class="max-h-[6rem] overflow-auto">
                <ul class="m-0 pl-0 list-none flex flex-col gap-[0.2rem] text-[0.76rem]">
                    {logs.map((entry, i) => (
                        <li class="flex gap-[0.35rem] items-start" key={i}>
                            <span class="w-[0.5rem] h-[0.5rem] rounded-[4px] bg-gradient-to-br from-[#ff7bb4] to-[#ffbe60] mt-[0.35rem] shadow-[0_0_4px_rgba(255,126,180,0.45)]" aria-hidden="true"></span>
                            <span class="flex-1 color-[#3e4c7e] leading-[1.3]">{entry}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
};
