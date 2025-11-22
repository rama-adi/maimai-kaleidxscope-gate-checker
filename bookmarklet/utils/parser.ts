import { DIFFICULTY_IDS } from "../constants";
import type { ParsedPlay, SongSearchResult } from "../types";

export function searchSongs(html: string, titles: string[]): SongSearchResult[] {
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

export function parsePlayHistory(html: string): ParsedPlay[] {
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

export function parseJstDate(s: string) {
    const m = s.match(/^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2})$/);
    if (!m) return null;
    const [, y, mo, d, h, mi] = m;
    return new Date(`${y}-${mo}-${d}T${h}:${mi}:00+09:00`);
}

export function getLatestPlayDate(plays: ParsedPlay[]) {
    return plays.reduce<Date | null>((latest, entry) => {
        if (!entry.lastPlayed) return latest;
        if (!latest || entry.lastPlayed.getTime() > latest.getTime()) return entry.lastPlayed;
        return latest;
    }, null);
}
