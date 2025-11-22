import { h } from "preact";

interface StatusPanelProps {
    statusMessage: string;
    logs: string[];
}

export const StatusPanel = ({ statusMessage, logs }: StatusPanelProps) => {
    return (
        <section class="lavenderhaze-status-panel">
            <p class="lavenderhaze-status-line">{statusMessage}</p>
            <div class="lavenderhaze-log">
                <ul class="lavenderhaze-log-list">
                    {logs.map((entry, i) => (
                        <li class="lavenderhaze-log-line" key={i}>
                            <span class="lavenderhaze-log-bullet" aria-hidden="true"></span>
                            <span class="lavenderhaze-log-text">{entry}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
};
