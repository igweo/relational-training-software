import { EnumQuestionType } from "./question.constants";

export const INF = Infinity;

export enum EnumScreens {
    Intro = "Intro",
    Start = "Start",
    Tutorial = "Tutorial",
    Game = "Game",
    Feedback = "Feedback",
    History = "History",
    Tutorials = "Tutorials",
    Stats = "Stats",
    PlaygroundMode = "Practice Mode",
    Settings = "Settings",
    TiersMatrix = "Tiers Matrix",
}

export enum EnumTiers {
    Beginner = "Beginner",
    Novice = "Novice",
    Apprentice = "Apprentice",
    Journeyman = "Journeyman",
    Artisan = "Artisan",
    Expert = "Expert",
    Master = "Master",
    Grandmaster = "Grandmaster",
    Virtuoso = "Virtuoso",
    Maestro = "Maestro",
    Legend = "Legend",
    Mythic = "Mythic",
    Paragon = "Paragon",
    Transcendent = "Transcendent",
    Ascendent = "Ascendent",
}

export const TIER_COLORS: Record<EnumTiers, { bgColor: string, textColor: string }> = {
    [EnumTiers.Beginner]:       { bgColor: "#F0F8FF", textColor: "#045D56" },  // Alice Blue with Teal
    [EnumTiers.Novice]:         { bgColor: "#ADD8E6", textColor: "#013220" },  // Light Blue with Deep Green
    [EnumTiers.Apprentice]:     { bgColor: "#E6E6FA", textColor: "#4B0082" },  // Lavender with Indigo
    [EnumTiers.Journeyman]:     { bgColor: "#D8BFD8", textColor: "#8B008B" },  // Thistle with Dark Magenta
    [EnumTiers.Artisan]:        { bgColor: "#DDA0DD", textColor: "#483D8B" },  // Plum with Dark Slate Blue
    [EnumTiers.Expert]:         { bgColor: "#B0E0E6", textColor: "#002366" },  // Powder Blue with Royal Blue
    [EnumTiers.Master]:         { bgColor: "#AFEEEE", textColor: "#004953" },  // Pale Turquoise with Deep Aqua
    [EnumTiers.Grandmaster]:    { bgColor: "#00CED1", textColor: "#002D62" },  // Dark Turquoise with Deep Blue
    [EnumTiers.Virtuoso]:       { bgColor: "#98FB98", textColor: "#006400" },  // Pale Green with Dark Green
    [EnumTiers.Maestro]:        { bgColor: "#FFFACD", textColor: "#556B2F" },  // Lemon Chiffon with Dark Olive Green
    [EnumTiers.Legend]:         { bgColor: "#FFDAB9", textColor: "#A0522D" },  // Peach Puff with Sienna
    [EnumTiers.Mythic]:         { bgColor: "#FFC0CB", textColor: "#8B0000" },  // Pink with Dark Red
    [EnumTiers.Paragon]:        { bgColor: "#D8BFD8", textColor: "#4A235A" },  // Thistle with Dark Purple
    [EnumTiers.Transcendent]:   { bgColor: "#C71585", textColor: "#FFE4E1" },  // Medium Violet Red with Misty Rose
    [EnumTiers.Ascendent]:      { bgColor: "#FFD700", textColor: "#1A1A1A" },  // Gold with Dark Text
};

export const TIER_SCORE_RANGES: Record<EnumTiers, { minScore: number, maxScore: number }> = {
  [EnumTiers.Beginner]:       { minScore: -INF, maxScore:  249 },
  [EnumTiers.Novice]:         { minScore:  250, maxScore:  499 },
  [EnumTiers.Apprentice]:     { minScore:  500, maxScore:  749 },
  [EnumTiers.Journeyman]:     { minScore:  750, maxScore:  999 },
  [EnumTiers.Artisan]:        { minScore: 1000, maxScore: 1249 },
  [EnumTiers.Expert]:         { minScore: 1250, maxScore: 1499 },
  [EnumTiers.Master]:         { minScore: 1500, maxScore: 1749 },
  [EnumTiers.Grandmaster]:    { minScore: 1750, maxScore: 1999 },
  [EnumTiers.Virtuoso]:       { minScore: 2000, maxScore: 2249 },
  [EnumTiers.Maestro]:        { minScore: 2250, maxScore: 2499 },
  [EnumTiers.Legend]:         { minScore: 2500, maxScore: 2749 },
  [EnumTiers.Mythic]:         { minScore: 2750, maxScore: 2999 },
  [EnumTiers.Paragon]:        { minScore: 3000, maxScore: 3249 },
  [EnumTiers.Transcendent]:   { minScore: 3250, maxScore: 3499 },
  [EnumTiers.Ascendent]:      { minScore: 3500, maxScore:  INF },
};

export const TIER_SCORE_ADJUSTMENTS: Record<EnumTiers, { increment: number, decrement: number }> = {
    [EnumTiers.Beginner]:       { increment: 50, decrement: 50 },
    [EnumTiers.Novice]:         { increment: 25, decrement: 25 },
    [EnumTiers.Apprentice]:     { increment: 10, decrement: 10 },
    [EnumTiers.Journeyman]:     { increment: 10, decrement: 10 },
    [EnumTiers.Artisan]:        { increment: 10, decrement: 10 },
    [EnumTiers.Expert]:         { increment: 10, decrement: 10 },
    [EnumTiers.Master]:         { increment: 10, decrement: 10 },
    [EnumTiers.Grandmaster]:    { increment: 10, decrement: 10 },
    [EnumTiers.Virtuoso]:       { increment: 10, decrement: 10 },
    [EnumTiers.Maestro]:        { increment: 10, decrement: 10 },
    [EnumTiers.Legend]:         { increment: 10, decrement: 10 },
    [EnumTiers.Mythic]:         { increment: 10, decrement: 10 },
    [EnumTiers.Paragon]:        { increment: 10, decrement: 10 },
    [EnumTiers.Transcendent]:   { increment: 10, decrement: 10 },
    [EnumTiers.Ascendent]:      { increment: 10, decrement: 10 },
};

export const ORDERED_TIERS = Object.keys(TIER_SCORE_RANGES) as EnumTiers[];

export const ORDERED_QUESTION_TYPES = [ 
    EnumQuestionType.GraphMatching,
    EnumQuestionType.Distinction,
    EnumQuestionType.ComparisonNumerical,
    EnumQuestionType.ComparisonChronological,
    EnumQuestionType.Syllogism,
    EnumQuestionType.LinearArrangement,
    EnumQuestionType.CircularArrangement,
    EnumQuestionType.Direction,
    EnumQuestionType.Direction3DSpatial,
    EnumQuestionType.Direction3DTemporal,
    EnumQuestionType.Analogy,
    EnumQuestionType.Binary,
    EnumQuestionType.InclusionExclusion,
];

export const TIERS_MATRIX: Record<number, [ 0|1, 0|1, 0|1, 0|1, 0|1, 0|1, 0|1, 0|1, 0|1, 0|1, 0|1, 0|1 ]> = {
  0: [  1,  1,  1,  0,  0,  0,  0,  0,  0,  0,  0,  0 ],
  1: [  1,  1,  1,  1,  0,  0,  0,  0,  0,  0,  0,  0 ],
  2: [  1,  1,  1,  1,  1,  0,  0,  0,  0,  0,  0,  0 ],
  3: [  1,  1,  1,  1,  1,  1,  0,  0,  0,  0,  0,  0 ],
  4: [  1,  1,  1,  1,  1,  1,  1,  0,  0,  0,  0,  0 ],
  5: [  1,  1,  1,  1,  1,  1,  1,  1,  1,  0,  1,  0 ],
  6: [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1 ],
  7: [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1 ],
  8: [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1 ],
  9: [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1 ],
 10: [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1 ],
 11: [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1 ],
 12: [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1 ],
 13: [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1 ],
 14: [  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1,  1 ],
};
