import { useState, useEffect } from "preact/hooks";
import type { GateInfo, SongStatusMap } from "../types";
import { SONG_SEARCH_URL } from "../constants";
import { fetchText } from "../utils/api";
import { searchSongs, getLatestPlayDate, parsePlayHistory } from "../utils/parser";
import { getUnplayedTitles } from "../utils/dom";

export function useSongChecker(gate: GateInfo, initialStatuses: SongStatusMap) {
    const [statuses, setStatuses] = useState<SongStatusMap>(new Map(initialStatuses));
    const [logs, setLogs] = useState<string[]>([]);
    const [statusMessage, setStatusMessage] = useState<string>("");
    const [currentChecking, setCurrentChecking] = useState<string | null>(null);
    const [isFinished, setIsFinished] = useState(false);

    const pushLog = (entry: string) => {
        setLogs(prev => [...prev, entry]);
    };

    useEffect(() => {
        let mounted = true;
        return;

        const runCheck = async () => {
            pushLog(`Loading songs from ${gate.gateName}...`);
            setStatusMessage("");

            try {
                const songListHtml = await fetchText(SONG_SEARCH_URL);
                if (!mounted) return;
                const searchResults = searchSongs(songListHtml, gate.songs);
                pushLog(`Fetched ${searchResults.length} songs. Checking play history...`);

                const missing: string[] = [];
                const failed: string[] = [];
                let processed = 0;
                const total = searchResults.length || 1;

                for (const result of searchResults) {
                    if (!mounted) return;

                    if (!result.url) {
                        missing.push(result.title);
                        setStatuses(prev => {
                            const next = new Map(prev);
                            next.set(result.title, "unplayed");
                            return next;
                        });
                        processed++;
                        pushLog(`Checked ${processed}/${total} songs...`);
                        continue;
                    }

                    setStatusMessage(`Currently checking ${result.title}...`);
                    setCurrentChecking(result.title);

                    try {
                        const playHtml = await fetchText(result.url);
                        if (!mounted) return;
                        const latestPlay = getLatestPlayDate(parsePlayHistory(playHtml));
                        setStatuses(prev => {
                            const next = new Map(prev);
                            if (!latestPlay || latestPlay.getTime() < gate.unlockDate.getTime()) {
                                next.set(result.title, "unplayed");
                            } else {
                                next.set(result.title, "completed");
                            }
                            return next;
                        });
                    } catch (err) {
                        console.error(`Failed to load play data for ${result.title}`, err);
                        failed.push(result.title);
                        setStatuses(prev => {
                            const next = new Map(prev);
                            next.set(result.title, "unplayed");
                            return next;
                        });
                    }

                    processed++;
                    pushLog(`Checked ${processed}/${total} songs...`);
                }

                if (!mounted) return;
                setStatusMessage("Finished checking songs.");
                setCurrentChecking(null);

                if (missing.length || failed.length) {
                    pushLog(`Skipped: ${missing.concat(failed).join(", ")}`);
                }
                setIsFinished(true);

            } catch (error) {
                if (!mounted) return;
                setStatusMessage("Failed to load songs.");
                const message = error instanceof Error ? error.message : String(error);
                pushLog(`An error occurred: ${message}`);
            }
        };

        runCheck();

        return () => {
            mounted = false;
        };
    }, []);

    const remainingCount = getUnplayedTitles(gate, statuses).length;

    return {
        statuses,
        logs,
        statusMessage,
        currentChecking,
        isFinished,
        remainingCount
    };
}
