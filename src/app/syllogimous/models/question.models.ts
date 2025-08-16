import { EnumArrangements, EnumQuestionType } from "../constants/question.constants";

export interface IArrangementRelationship {
    description: EnumArrangements;
    steps: number;
}

export interface IArrangementPremise {
    a: string;
    b: string;
    relationship: IArrangementRelationship;
    metaRelationships: IArrangementPremise[],
    uid: string;
}

export interface IDirectionProposition {
    pair: [[string, number, number], [string, number, number]];
    trasversalDifference?: number;
    cardinals: [string, number][];
    relationship: string;
    uid: string;
}

export interface IDirection3DProposition {
    pair: [[string, number, number, number], [string, number, number, number]];
    trasversalDifference: number;
    cardinals: [string, number][];
    relationship: string;
    uid: string;
}

export interface IGlyph {
    id: string;
    svgPath: string;
    color: string;
    relationType?: string; // e.g. Distinction, ComparisonNumerical, ComparisonChronological
    isPositive?: boolean;  // true for positive relation, false for negative
    steps?: number;        // number of steps for relations that use it

    // New visual transform options
    rotation?: number;
    scale?: number;
    filter?: string;
}

export class Question {
    instructions?: string[];
    notes?: string[];
    type: EnumQuestionType;
    isValid = false;
    premises: string[] = [];
    conclusion: string | string[] = "";
    createdAt = new Date().getTime();
    answeredAt = new Date().getTime();
    userAnswer?: boolean;
    negations = 0;
    metaRelations = 0;
    timerTypeOnAnswer = "0";
    userScore = 0;
    playgroundMode = false;
    // Technical fields
    rule = "";
    bucket: string[] = [];
    buckets: string[][] = [];
    coords: [string, number, number][] = [];
    coords3D: [string, number, number, number][] = [];
    graphPremises: [string, string, string][] = [];
    graphConclusion: [string, string, string][] = [];

    // Matrix reasoning specific fields
    matrix?: string[][];
    missingPosition?: { row: number; col: number };
    options?: string[];
    correctAnswer?: string;

    // New glyphs array for visual relation encoding
    glyphs?: import("./question.models").IGlyph[];

    constructor(type: EnumQuestionType) {
        this.type = type;
    }
}
