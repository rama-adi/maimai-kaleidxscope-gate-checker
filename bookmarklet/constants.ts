import type { DifficultyId, GateInfo } from "./types";

export const FAVORITES_HOST = "maimaidx-eng.com";
export const FAVORITES_PATH = "/maimai-mobile/home/userOption/favorite/updateMusic";
export const FAVORITES_URL = `https://${FAVORITES_HOST}${FAVORITES_PATH}`;
export const SONG_SEARCH_URL = "https://maimaidx-eng.com/maimai-mobile/record/musicGenre/search/?genre=99&diff=0";

export const SELECTORS = {
    NON_FAVORITES_PAGE_TARGET: 'body > div.wrapper.main_wrapper.t_c > div.see_through_block.m_15.m_t_10.p_10.p_r.t_l.f_0',
    FAVORITES_PAGE_NAV_TARGET: '#nav > div:nth-child(3)',
};

export const DIFFICULTY_IDS: DifficultyId[] = ["basic", "advanced", "expert", "master", "remaster"];

export const GATE_DEFINITIONS = {
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

export type GateId = keyof typeof GATE_DEFINITIONS;
