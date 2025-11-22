import { render, h, Fragment } from "preact";
import { useState, useEffect, useRef } from "preact/hooks";

interface GateInfo {
    gateName: string;
    unlockDate: Date;
    songs: string[];
}

type SongStatus = "unplayed" | "completed";

type SongStatusMap = Map<string, SongStatus>;

interface SongSearchResult {
    title: string;
    url: string | null;
}

type DifficultyId = "basic" | "advanced" | "expert" | "master" | "remaster";

interface ParsedPlay {
    difficulty: DifficultyId;
    level: string | null;
    isDX: boolean;
    scorePercent: string | null;
    deluxeScore: number | null;
    deluxeMax: number | null;
    lastPlayed: Date | null;
    playCount: number | null;
}

const FAVORITES_HOST = "maimaidx-eng.com";
const FAVORITES_PATH = "/maimai-mobile/home/userOption/favorite/updateMusic";
const FAVORITES_URL = `https://${FAVORITES_HOST}${FAVORITES_PATH}`;
const SONG_SEARCH_URL = "https://maimaidx-eng.com/maimai-mobile/record/musicGenre/search/?genre=99&diff=0";

const DIFFICULTY_IDS: DifficultyId[] = ["basic", "advanced", "expert", "master", "remaster"];

const GATE_DEFINITIONS = {
    blue: {
        gateName: "青の扉",
        unlockDate: new Date("2025-01-16T10:00:00+09:00"),
        songs: [
            "STEREOSCAPE",
            "Crazy Circle",
            "Ututu",
            "シエルブルーマルシェ",
            "ブレインジャックシンドローム",
            "共鳴",
            "REAL VOICE",
            "オリフィス",
            "ユメヒバナ",
            "パラボラ",
            "星めぐり、果ての君へ。",
            "スローアライズ",
            "生命不詳",
            "チエルカ／エソテリカ",
            "RIFFRAIN",
            "Falling",
            "ピリオドサイン",
            "群青シグナル",
            "アンバークロニクル",
            "Kairos",
            "リフヴェイン",
            "宵の鳥",
            "フタタビ",
            "シックスプラン",
            "ふらふらふら、",
            "フェイクフェイス・フェイルセイフ",
            "パラドクスイヴ",
            "YKWTD",
            "184億回のマルチトニック"
        ]
    },
    black: {
        gateName: "黒の扉",
        unlockDate: new Date("2025-02-27T10:00:00+09:00"),
        songs: [
            "Blows Up Everything",
            "≠彡\"/了→",
            "U&iVERSE -銀河鸞翔-",
            "Rising on the horizon",
            "KHYMΞXΛ",
            "Divide et impera!",
            "Valsqotch",
            "BREaK! BREaK! BREaK!",
            "GIGANTØMAKHIA",
            "ViRTUS",
            "系ぎて"
        ]
    },
    red: {
        gateName: "赤の扉",
        unlockDate: new Date("2025-09-26T10:00:00+09:00"),
        songs: [
            "ドラゴンエネルギー",
            "Garden Of The Dragon",
            "DRAGONLADY",
            "好きな惣菜発表ドラゴン",
            "KONNANじゃないっ！",
            "Brand-new Japanesque",
            "Outlaw's Lullaby",
            "鼓動",
            "神室雪月花",
            "ばかみたい【Taxi Driver Edition】"
        ]
    }
} satisfies Record<string, GateInfo>;

type GateId = keyof typeof GATE_DEFINITIONS;

function ensureOnFavoritesPage(): boolean {
    const { hostname, pathname } = window.location;
    if (hostname === FAVORITES_HOST && pathname === FAVORITES_PATH) return true;

    const go = confirm("This bookmarklet should be run on the music favorite list page, do you want to go there and rerun the script");
    if (go) window.location.href = FAVORITES_URL;
    return false;
}

function promptForGateSelection(): GateId | null {
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

function isGateId(value: string): value is GateId {
    return Object.prototype.hasOwnProperty.call(GATE_DEFINITIONS, value);
}

function initializeSongStatuses(gate: GateInfo): SongStatusMap {
    const statuses = new Map<string, SongStatus>();
    gate.songs.forEach(title => statuses.set(title, "unplayed"));
    return statuses;
}

function getUnplayedTitles(gate: GateInfo, statuses: SongStatusMap) {
    return gate.songs.filter(title => statuses.get(title) === "unplayed");
}

function handleAddToFavorites(gate: GateInfo, statuses: SongStatusMap, onClose: () => void) {
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

async function fetchText(url: string) {
    const response = await fetch(url, { credentials: "include" });
    return await response.text();
}

function searchSongs(html: string, titles: string[]): SongSearchResult[] {
    const base = "https://maimaidx-eng.com/maimai-mobile/record/musicDetail/";
    const doc = new DOMParser().parseFromString(html, "text/html");
    const blocks = Array.from(doc.querySelectorAll<HTMLDivElement>(".w_450.m_15.p_r.f_0"));

    const entries = blocks.map(block => {
        const titleEl = block.querySelector<HTMLElement>(".music_name_block");
        const form = block.querySelector<HTMLFormElement>("form[action*=\"musicDetail\"]");
        const idx = form?.querySelector<HTMLInputElement>("input[name=\"idx\"]")?.value;

        return { title: titleEl?.textContent.trim() || null, idx: idx || null };
    });

    const normalize = (s: string) => s.replace(/\s+/g, "").trim();

    return titles.map(title => {
        const match = entries.find(e => e.title && normalize(e.title) === normalize(title));
        if (!match || !match.idx) return { title, url: null };
        return { title, url: `${base}?idx=${encodeURIComponent(match.idx)}` };
    });
}

function parsePlayHistory(html: string): ParsedPlay[] {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const results: ParsedPlay[] = [];

    for (const id of DIFFICULTY_IDS) {
        const block = doc.querySelector<HTMLElement>(`#${id}`);
        if (!block) continue;

        const level = block.querySelector<HTMLElement>(".music_lv_back")?.textContent?.trim() || null;
        const isDX = Boolean(block.querySelector('.music_kind_icon[src*="music_dx"]'));
        const scorePercent = block.querySelector<HTMLElement>(".music_score_block.w_120")?.textContent?.trim() || null;

        const deluxeBlock = block.querySelector<HTMLElement>(".music_score_block.w_310");
        let deluxeScore: number | null = null;
        let deluxeMax: number | null = null;

        if (deluxeBlock) {
            const text = deluxeBlock.textContent?.replace(/\s+/g, " ").trim() || "";
            const m = text.match(/(\d+)\s*\/\s*(\d+)/);
            if (m) {
                deluxeScore = Number(m[1]);
                deluxeMax = Number(m[2]);
            }
        }

        let lastPlayedRaw: string | null = null;
        let playCount: number | null = null;

        const rows = Array.from(block.querySelectorAll<HTMLTableRowElement>("table.collapse tr"));
        for (const row of rows) {
            const cells = Array.from(row.querySelectorAll<HTMLTableCellElement>("td"));
            const label = cells[0]?.textContent?.trim() || "";
            const value = cells[1]?.textContent?.trim() || "";
            if (label.startsWith("Last played")) lastPlayedRaw = value;
            if (label.startsWith("PLAY COUNT")) playCount = Number(value);
        }

        results.push({
            difficulty: id,
            level,
            isDX,
            scorePercent,
            deluxeScore,
            deluxeMax,
            lastPlayed: lastPlayedRaw ? parseJstDate(lastPlayedRaw) : null,
            playCount
        });
    }

    return results;
}

function parseJstDate(s: string) {
    const m = s.match(/^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2})$/);
    if (!m) return null;
    const [, y, mo, d, h, mi] = m;
    return new Date(`${y}-${mo}-${d}T${h}:${mi}:00+09:00`);
}

function getLatestPlayDate(plays: ParsedPlay[]) {
    return plays.reduce<Date | null>((latest, entry) => {
        if (!entry.lastPlayed) return latest;
        if (!latest || entry.lastPlayed.getTime() > latest.getTime()) return entry.lastPlayed;
        return latest;
    }, null);
}

const App = ({ gate, initialStatuses, onClose }: { gate: GateInfo, initialStatuses: SongStatusMap, onClose: () => void }) => {
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
                const remaining = getUnplayedTitles(gate, statuses); // Note: this uses stale closure statuses, but we only need length for log which is fine or we should use functional update if we needed exact count but here we just want to log. Actually better to calculate from current state if possible, but for log it's okay.
                // Re-calculating remaining from latest state would be better but complex in loop.
                // Let's just trust the loop finished.

                // Correct way to get final remaining count:
                const finalStatuses = new Map(statuses); // This is still stale.
                // We can't easily access the *final* state here without refs or functional updates that return values.
                // But we know what we set.
                // Let's just say "Finished".

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
    }, []); // Empty dependency array means this runs once on mount

    const remainingCount = getUnplayedTitles(gate, statuses).length;

    return (
        <div class="lavenderhaze-window">
            <style>{`:host{position:fixed;inset:0;z-index:999999;font-family:"M PLUS Rounded 1c","ヒラギノ角ゴ Pro W3",Meiryo,"ＭＳ Ｐゴシック","MS P Gothic",sans-serif;color:#1e3b75}#backdrop{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(21,66,165,.35);backdrop-filter:blur(1px);}#modal{width:min(420px,92vw);background:transparent;border:none;padding:0;margin:0;}#modal *{box-sizing:border-box;}#modal .lavenderhaze-window{background:linear-gradient(180deg,#fdfcff 0%,#d9eeff 100%);border:4px solid #0e3c6e;border-radius:24px;box-shadow:0 12px 35px rgba(0,0,0,.35);overflow:hidden;}#modal .lavenderhaze-header{padding:1rem 1.2rem;border-bottom:3px solid #bedfff;display:flex;flex-direction:column;gap:.75rem;}#modal .lavenderhaze-title-block .lavenderhaze-eyebrow{margin:0;text-transform:uppercase;font-size:.7rem;letter-spacing:.15em;color:#4f7dc9;font-weight:700;}#modal .lavenderhaze-title-block h1{margin:.05rem 0 0;font-size:1.25rem;color:#0f2f63;}#modal .lavenderhaze-title-block .lavenderhaze-date{margin:.2rem 0 0;font-size:.8rem;color:#4a5d9b;}#modal .lavenderhaze-meta{display:flex;gap:.5rem;flex-wrap:wrap;}#modal .lavenderhaze-meta-card{flex:1 1 120px;background:#fff;border-radius:16px;border:2px solid #8cc5ff;padding:.45rem .6rem;display:flex;flex-direction:column;}#modal .lavenderhaze-meta-label{font-size:.68rem;color:#4f678e;text-transform:uppercase;letter-spacing:.08em;}#modal .lavenderhaze-meta-value{font-size:1.15rem;font-weight:700;color:#0f2f63;}#modal .lavenderhaze-section{margin:.85rem 1.15rem;background:#fff;border-radius:18px;border:3px solid #8cc5ff;padding:.9rem;}#modal .lavenderhaze-section .lavenderhaze-note{margin:.1rem 0;color:#37538c;font-size:.82rem;}#song-list{margin-top:.6rem;padding-left:0;max-height:12.5rem;overflow:auto;list-style:none;}#song-list::-webkit-scrollbar{width:8px;}#song-list::-webkit-scrollbar-thumb{background:#8ec5ff;border-radius:8px;}#modal .lavenderhaze-song{display:flex;align-items:center;gap:.55rem;padding:.35rem .4rem;margin-bottom:.25rem;border-radius:16px;border:2px dashed transparent;background:#f3f8ff;}#modal .lavenderhaze-song.is-active{border-color:#ffaf00;background:#fff4da;}#modal .lavenderhaze-song.completed{background:#ebffe7;border-color:#7dcf62;}#modal .lavenderhaze-song .lavenderhaze-song-icon{width:2rem;height:2rem;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1rem;background:#fff;border:2px solid #0e3c6e;}#modal .lavenderhaze-song .lavenderhaze-song-body{display:flex;flex-direction:column;gap:.12rem;flex:1;}#modal .lavenderhaze-song-title{font-weight:700;color:#122c63;font-size:.9rem;}#modal .lavenderhaze-song-tag{font-size:.7rem;letter-spacing:.08em;text-transform:uppercase;}#modal .lavenderhaze-status-panel{margin:0 1.15rem .85rem;padding:.85rem;background:#fff;border-radius:18px;border:3px solid #f6b4ff;}#modal .lavenderhaze-status-line{margin:0 0 .45rem;font-weight:700;color:#511f99;}#modal .lavenderhaze-log{max-height:6rem;overflow:auto;}#modal .lavenderhaze-log-list{margin:0;padding-left:0;list-style:none;display:flex;flex-direction:column;gap:.2rem;font-size:.76rem;}#modal .lavenderhaze-log-line{display:flex;gap:.35rem;align-items:flex-start;}#modal .lavenderhaze-log-bullet{width:.5rem;height:.5rem;border-radius:4px;background:linear-gradient(135deg,#ff7bb4,#ffbe60);margin-top:.35rem;box-shadow:0 0 4px rgba(255,126,180,.45);}#modal .lavenderhaze-log-text{flex:1;color:#3e4c7e;line-height:1.3;}#modal .lavenderhaze-footer{display:flex;justify-content:space-between;gap:.5rem;margin:0 1.15rem .85rem;font-size:.7rem;color:#4f678e;align-items:center;}#modal .lavenderhaze-footer a{color:#3b6fd4;text-decoration:none;font-weight:700;}#modal .btn-row{display:flex;gap:.75rem;margin:0 1.15rem 1.15rem;}#modal .lavenderhaze-actions button{flex:1;border:none;padding:.8rem .95rem;border-radius:18px;font-size:.9rem;font-weight:700;cursor:pointer;transition:transform .2s ease,box-shadow .2s ease;}#modal .btn-light{background:#fff;border:3px solid #8cc5ff;color:#1f3f7a;box-shadow:0 3px 0 #4c87c1;}#modal .btn-dark{background:linear-gradient(135deg,#f85da8,#f2a549);border:3px solid #a3296b;color:#fff;box-shadow:0 3px 0 #741a48;}#modal .lavenderhaze-actions button:active{transform:translateY(2px);box-shadow:0 1px 0 rgba(0,0,0,.25);}@media (max-width:480px){#modal .lavenderhaze-meta{flex-direction:column;}#modal .lavenderhaze-window{border-width:3px;border-radius:20px;}}`}</style>
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

function bookmarklet() {
    if (!ensureOnFavoritesPage()) return;
    const gateId = promptForGateSelection();
    if (!gateId) return;

    const gate = GATE_DEFINITIONS[gateId];
    const initialStatuses = initializeSongStatuses(gate);

    const host = document.createElement("div");
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: "open" });

    // Container for Preact
    const container = document.createElement("div");
    container.id = "backdrop";
    container.innerHTML = '<div id="modal"></div>';
    shadow.appendChild(container);

    const modalRoot = container.querySelector("#modal");
    if (!modalRoot) return;

    const onClose = () => {
        render(null, modalRoot);
        host.remove();
    };

    render(<App gate={gate} initialStatuses={initialStatuses} onClose={onClose} />, modalRoot);
}

bookmarklet();
