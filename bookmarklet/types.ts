export interface GateInfo {
    gateName: string;
    unlockDate: Date;
    songs: string[];
}

export type SongStatus = "unplayed" | "completed";

export type SongStatusMap = Map<string, SongStatus>;

export interface SongSearchResult {
    title: string;
    url: string | null;
}

export type DifficultyId = "basic" | "advanced" | "expert" | "master" | "remaster";

export interface ParsedPlay {
    difficulty: DifficultyId;
    level: string | null;
    isDX: boolean;
    scorePercent: string | null;
    deluxeScore: number | null;
    deluxeMax: number | null;
    lastPlayed: Date | null;
    playCount: number | null;
}
