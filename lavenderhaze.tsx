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

interface ModalActions {
    onAddToFavorites: () => void;
    onClose: () => void;
}

interface ModalUI {
    renderSongList: (currentTitle?: string | null) => void;
    setStatus: (message: string) => void;
    setProgress: (content: string) => void;
    showActions: (actions: ModalActions) => void;
    destroy: () => void;
}

const renderHtml = (node: unknown): string => {
    if (node == null) return "";
    return typeof node === "string" ? node : (node as { toString(): string }).toString();
};

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

function bookmarklet() {
    if (!ensureOnFavoritesPage()) return;
    const gateId = promptForGateSelection();
    if (!gateId) return;

    const gate = GATE_DEFINITIONS[gateId];
    const songStatuses = initializeSongStatuses(gate);
    const ui = createModal(gate, songStatuses);

    runGateCheck(gate, songStatuses, ui)
        .catch(err => console.error("Unable to complete song checks.", err))
        .finally(() => {
            ui.showActions({
                onAddToFavorites: () => handleAddToFavorites(gate, songStatuses, ui),
                onClose: () => ui.destroy()
            });
        });
}

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

function createModal(gate: GateInfo, statuses: SongStatusMap): ModalUI {
    const host = document.createElement("div");
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = renderHtml(
        <div>
            <style>{`:host{position:fixed;inset:0;z-index:999999;font-family:"M PLUS Rounded 1c","ヒラギノ角ゴ Pro W3",Meiryo,"ＭＳ Ｐゴシック","MS P Gothic",sans-serif;color:#1e3b75}#backdrop{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(21,66,165,.35);backdrop-filter:blur(1px);}#modal{width:min(420px,92vw);background:transparent;border:none;padding:0;margin:0;}#modal *{box-sizing:border-box;}#modal .mh-window{background:linear-gradient(180deg,#fdfcff 0%,#d9eeff 100%);border:4px solid #0e3c6e;border-radius:24px;box-shadow:0 12px 35px rgba(0,0,0,.35);overflow:hidden;}#modal .mh-header{padding:1rem 1.2rem;border-bottom:3px solid #bedfff;display:flex;flex-direction:column;gap:.75rem;}#modal .mh-title-block .mh-eyebrow{margin:0;text-transform:uppercase;font-size:.7rem;letter-spacing:.15em;color:#4f7dc9;font-weight:700;}#modal .mh-title-block h1{margin:.05rem 0 0;font-size:1.25rem;color:#0f2f63;}#modal .mh-title-block .mh-date{margin:.2rem 0 0;font-size:.8rem;color:#4a5d9b;}#modal .mh-meta{display:flex;gap:.5rem;flex-wrap:wrap;}#modal .mh-meta-card{flex:1 1 120px;background:#fff;border-radius:16px;border:2px solid #8cc5ff;padding:.45rem .6rem;display:flex;flex-direction:column;}#modal .mh-meta-label{font-size:.68rem;color:#4f678e;text-transform:uppercase;letter-spacing:.08em;}#modal .mh-meta-value{font-size:1.15rem;font-weight:700;color:#0f2f63;}#modal .mh-section{margin:.85rem 1.15rem;background:#fff;border-radius:18px;border:3px solid #8cc5ff;padding:.9rem;}#modal .mh-section .mh-note{margin:.1rem 0;color:#37538c;font-size:.82rem;}#song-list{margin-top:.6rem;padding-left:0;max-height:12.5rem;overflow:auto;list-style:none;}#song-list::-webkit-scrollbar{width:8px;}#song-list::-webkit-scrollbar-thumb{background:#8ec5ff;border-radius:8px;}#modal .mh-song{display:flex;align-items:center;gap:.55rem;padding:.35rem .4rem;margin-bottom:.25rem;border-radius:16px;border:2px dashed transparent;background:#f3f8ff;}#modal .mh-song.is-active{border-color:#ffaf00;background:#fff4da;}#modal .mh-song.completed{background:#ebffe7;border-color:#7dcf62;}#modal .mh-song .mh-song-icon{width:2rem;height:2rem;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1rem;background:#fff;border:2px solid #0e3c6e;}#modal .mh-song .mh-song-body{display:flex;flex-direction:column;gap:.12rem;flex:1;}#modal .mh-song-title{font-weight:700;color:#122c63;font-size:.9rem;}#modal .mh-song-tag{font-size:.7rem;letter-spacing:.08em;text-transform:uppercase;}#modal .mh-status-panel{margin:0 1.15rem .85rem;padding:.85rem;background:#fff;border-radius:18px;border:3px solid #f6b4ff;}#modal .mh-status-line{margin:0 0 .45rem;font-weight:700;color:#511f99;}#modal .mh-log{max-height:6rem;overflow:auto;}#modal .mh-log-list{margin:0;padding-left:0;list-style:none;display:flex;flex-direction:column;gap:.2rem;font-size:.76rem;}#modal .mh-log-line{display:flex;gap:.35rem;align-items:flex-start;}#modal .mh-log-bullet{width:.5rem;height:.5rem;border-radius:4px;background:linear-gradient(135deg,#ff7bb4,#ffbe60);margin-top:.35rem;box-shadow:0 0 4px rgba(255,126,180,.45);}#modal .mh-log-text{flex:1;color:#3e4c7e;line-height:1.3;}#modal .mh-footer{display:flex;justify-content:space-between;gap:.5rem;margin:0 1.15rem .85rem;font-size:.7rem;color:#4f678e;align-items:center;}#modal .mh-footer a{color:#3b6fd4;text-decoration:none;font-weight:700;}#modal .btn-row{display:flex;gap:.75rem;margin:0 1.15rem 1.15rem;}#modal .mh-actions button{flex:1;border:none;padding:.8rem .95rem;border-radius:18px;font-size:.9rem;font-weight:700;cursor:pointer;transition:transform .2s ease,box-shadow .2s ease;}#modal .btn-light{background:#fff;border:3px solid #8cc5ff;color:#1f3f7a;box-shadow:0 3px 0 #4c87c1;}#modal .btn-dark{background:linear-gradient(135deg,#f85da8,#f2a549);border:3px solid #a3296b;color:#fff;box-shadow:0 3px 0 #741a48;}#modal .mh-actions button:active{transform:translateY(2px);box-shadow:0 1px 0 rgba(0,0,0,.25);}@media (max-width:480px){#modal .mh-meta{flex-direction:column;}#modal .mh-window{border-width:3px;border-radius:20px;}}`}</style>
            <div id="backdrop">
                <div id="modal">
                    <div class="mh-window">
                        <header class="mh-header">
                            <div class="mh-title-block">
                                <p class="mh-eyebrow">Gate tracker</p>
                                <h1>{gate.gateName}</h1>
                                <p class="mh-date">Checking plays on or after {gate.unlockDate.toLocaleDateString()}</p>
                            </div>
                            <div class="mh-meta">
                                <div class="mh-meta-card">
                                    <span class="mh-meta-label">Tracked songs</span>
                                    <span class="mh-meta-value">{gate.songs.length}</span>
                                </div>
                                <div class="mh-meta-card">
                                    <span class="mh-meta-label">Need to replay</span>
                                    <span class="mh-meta-value" id="mh-remaining-count">Updating…</span>
                                </div>
                            </div>
                        </header>
                        <section class="mh-section">
                            <p class="mh-note">Below are all songs with their current status. The list updates live while your history is checked.</p>
                            <ol id="song-list" class="mh-song-list"></ol>
                        </section>
                        <section class="mh-status-panel">
                            <p id="current-checking" class="mh-status-line"></p>
                            <div id="loading-indicator" class="mh-log"></div>
                        </section>
                        <div class="mh-footer">
                            <span>Made by Onebyte</span>
                            <a href="https://github.com/rama-adi" target="_blank" rel="noopener noreferrer">github.com/rama-adi</a>
                        </div>
                        <div class="btn-row mh-actions" id="action-row"></div>
                    </div>
                </div>
            </div>
        </div>
    );

    const songList = shadow.getElementById("song-list");
    const statusEl = shadow.getElementById("current-checking");
    const progressEl = shadow.getElementById("loading-indicator");
    const actionRow = shadow.getElementById("action-row");
    const remainingCountEl = shadow.getElementById("mh-remaining-count");

    const renderSongList = (currentTitle: string | null = null) => {
        if (!songList) return;
        songList.innerHTML = renderHtml(
            <>
                {gate.songs.map(title => {
                    const status = statuses.get(title) ?? "unplayed";
                    const isActive = title === currentTitle;
                    const icon = isActive ? "➡️" : status === "completed" ? "✅" : "☆";
                    const tagText = isActive ? "Checking" : status === "completed" ? "Played" : "Needs play";
                    const classes = `mh-song ${status}${isActive ? " is-active" : ""}`;
                    return (
                        <li class={classes}>
                            <span class="mh-song-icon" aria-hidden="true">{icon}</span>
                            <div class="mh-song-body">
                                <span class="mh-song-title">{title}</span>
                                <span class="mh-song-tag">{tagText}</span>
                            </div>
                        </li>
                    );
                })}
            </>
        );
        if (remainingCountEl) {
            const remaining = getUnplayedTitles(gate, statuses).length;
            remainingCountEl.textContent = `${remaining} song${remaining === 1 ? "" : "s"}`;
        }
    };

    renderSongList();

    return {
        renderSongList,
        setStatus: msg => statusEl && (statusEl.innerHTML = renderHtml(<span>{msg}</span>)),
        setProgress: c => progressEl && (progressEl.innerHTML = c),
        showActions: actions => {
            if (!actionRow) return;
            actionRow.innerHTML = renderHtml(
                <>
                    <button class="btn-light" id="closeBtn">Close</button>
                    <button class="btn-dark" id="addBtn">Add to favorites</button>
                </>
            );
            const addBtn = shadow.getElementById("addBtn");
            if (addBtn) addBtn.addEventListener("click", actions.onAddToFavorites);
            const closeBtn = shadow.getElementById("closeBtn");
            if (closeBtn) closeBtn.addEventListener("click", actions.onClose);
        },
        destroy: () => host.remove()
    };
}

function renderProgressLog(entries: string[]) {
    return renderHtml(
        <ul class="mh-log-list">
            {entries.map(entry => (
                <li class="mh-log-line">
                    <span class="mh-log-bullet" aria-hidden="true"></span>
                    <span class="mh-log-text">{entry}</span>
                </li>
            ))}
        </ul>
    );
}

function handleAddToFavorites(gate: GateInfo, statuses: SongStatusMap, ui: ModalUI) {
    const remaining = getUnplayedTitles(gate, statuses);
    if (!remaining.length) {
        alert("All songs have already been played since the gate opened!");
        return;
    }

    document.querySelectorAll<HTMLElement>(".favorite_checkbox_frame.m_10").forEach(node => {
        if (remaining.some(song => node.innerText.includes(song))) node.click();
    });

    alert("Songs are checked, now you just need to save them :-)");
    ui.destroy();
}

async function runGateCheck(gate: GateInfo, statuses: SongStatusMap, ui: ModalUI) {
    const logEntries = [`Loading songs from ${gate.gateName}...`];
    const refreshLog = () => ui.setProgress(renderProgressLog(logEntries));
    const pushLog = (entry: string) => {
        logEntries.push(entry);
        refreshLog();
    };

    refreshLog();
    ui.setStatus("");
    ui.renderSongList();

    try {
        const songListHtml = await fetchText(SONG_SEARCH_URL);
        const searchResults = searchSongs(songListHtml, gate.songs);
        pushLog(`Fetched ${searchResults.length} songs. Checking play history...`);

        const missing: string[] = [];
        const failed: string[] = [];
        let processed = 0;
        const total = searchResults.length || 1;

        for (const result of searchResults) {
            if (!result.url) {
                missing.push(result.title);
                statuses.set(result.title, "unplayed");
                processed++;
                pushLog(`Checked ${processed}/${total} songs...`);
                ui.renderSongList();
                continue;
            }

            ui.setStatus(`Currently checking ${result.title}...`);
            ui.renderSongList(result.title);

            try {
                const playHtml = await fetchText(result.url);
                const latestPlay = getLatestPlayDate(parsePlayHistory(playHtml));
                if (!latestPlay || latestPlay.getTime() < gate.unlockDate.getTime()) {
                    statuses.set(result.title, "unplayed");
                } else {
                    statuses.set(result.title, "completed");
                }
            } catch (err) {
                console.error(`Failed to load play data for ${result.title}`, err);
                failed.push(result.title);
                statuses.set(result.title, "unplayed");
            }

            processed++;
            pushLog(`Checked ${processed}/${total} songs...`);
            ui.renderSongList();
        }

        ui.setStatus("Finished checking songs.");
        const remaining = getUnplayedTitles(gate, statuses);
        pushLog(`Found ${remaining.length} song(s) that still need to be played.`);
        if (missing.length || failed.length) {
            pushLog(`Skipped: ${missing.concat(failed).join(", ")}`);
        }

        return { missingSongs: missing, failedSongs: failed };
    } catch (error) {
        ui.setStatus("Failed to load songs.");
        const message = error instanceof Error ? error.message : String(error);
        pushLog(`An error occurred: ${message}`);
        throw error;
    }
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

bookmarklet();
