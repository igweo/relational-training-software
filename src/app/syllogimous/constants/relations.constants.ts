import { EnumQuestionType } from "./question.constants";

export enum RelationKey {
    SameAs,
    DifferentFrom,

    GreaterThan,
    LessThan,
    EqualTo,
    NotEqualTo,

    Before,
    After,
    ConcurrentWith,

    Since,
    Until,
    During,
    Throughout,
    ForDuration,

    DownstreamOf,
    UpstreamOf,

    Above,
    Below,
    InFrontOf,
    Behind,
    NorthOf,
    SouthOf,
    EastOf,
    WestOf,
    Inside,
    Outside,
    Between,
    Beside,
    Near,
    Far,
    AdjacentTo,
    AcrossFrom,
    On,
    Under,

    ConnectedTo,
    DisconnectedFrom,

    Confirms,
    Refutes,
    Supports,
    Undermines,

    Causes,
    CausedBy,
    Enables,
    Inhibits,
    Implies,
    Contradicts
}

type Domain = "generic" | "numerical" | "temporal" | "spatial" | "graph" | "causal";

type Entry = {
    opposite?: RelationKey;
    domains: Domain[];
    asPP: string[];
    asVerb: string[];
};

const pick = <T>(a: T[]) => a[Math.floor(Math.random() * a.length)];

export const RELATIONS: Record<RelationKey, Entry> = {
    [RelationKey.SameAs]: { opposite: RelationKey.DifferentFrom, domains: ["generic"], asPP: ["equivalent to", "identical to", "the same as"], asVerb: ["matches", "coincides with", "is identical to"] },
    [RelationKey.DifferentFrom]: { opposite: RelationKey.SameAs, domains: ["generic"], asPP: ["different from", "distinct from"], asVerb: ["differs from", "diverges from", "contrasts with"] },

    [RelationKey.GreaterThan]: { opposite: RelationKey.LessThan, domains: ["numerical"], asPP: ["greater than", "higher than", "more than"], asVerb: ["exceeds", "outweighs", "surpasses"] },
    [RelationKey.LessThan]: { opposite: RelationKey.GreaterThan, domains: ["numerical"], asPP: ["less than", "lower than", "fewer than"], asVerb: ["falls short of", "is outweighed by", "is surpassed by"] },
    [RelationKey.EqualTo]: { opposite: RelationKey.NotEqualTo, domains: ["numerical"], asPP: ["equal to"], asVerb: ["equals", "is equal to"] },
    [RelationKey.NotEqualTo]: { opposite: RelationKey.EqualTo, domains: ["numerical"], asPP: ["not equal to"], asVerb: ["differs from"] },

    [RelationKey.Before]: { opposite: RelationKey.After, domains: ["temporal"], asPP: ["before", "earlier than", "prior to"], asVerb: ["precedes", "comes before"] },
    [RelationKey.After]: { opposite: RelationKey.Before, domains: ["temporal"], asPP: ["after", "later than", "subsequent to"], asVerb: ["follows", "comes after"] },
    [RelationKey.ConcurrentWith]: { domains: ["temporal"], asPP: ["concurrent with", "at the same time as"], asVerb: ["coincides with", "overlaps with"] },

    [RelationKey.Since]: { domains: ["temporal"], asPP: ["since"], asVerb: [] },
    [RelationKey.Until]: { domains: ["temporal"], asPP: ["until"], asVerb: [] },
    [RelationKey.During]: { domains: ["temporal"], asPP: ["during"], asVerb: [] },
    [RelationKey.Throughout]: { domains: ["temporal"], asPP: ["throughout"], asVerb: [] },
    [RelationKey.ForDuration]: { domains: ["temporal"], asPP: ["for the duration of"], asVerb: [] },

    [RelationKey.DownstreamOf]: { opposite: RelationKey.UpstreamOf, domains: ["temporal", "spatial"], asPP: ["downstream of"], asVerb: [] },
    [RelationKey.UpstreamOf]: { opposite: RelationKey.DownstreamOf, domains: ["temporal", "spatial"], asPP: ["upstream of"], asVerb: [] },

    [RelationKey.Above]: { opposite: RelationKey.Below, domains: ["spatial"], asPP: ["above"], asVerb: ["overlies"] },
    [RelationKey.Below]: { opposite: RelationKey.Above, domains: ["spatial"], asPP: ["below"], asVerb: ["underlies"] },
    [RelationKey.InFrontOf]: { opposite: RelationKey.Behind, domains: ["spatial"], asPP: ["in front of", "ahead of"], asVerb: [] },
    [RelationKey.Behind]: { opposite: RelationKey.InFrontOf, domains: ["spatial"], asPP: ["behind"], asVerb: [] },
    [RelationKey.NorthOf]: { opposite: RelationKey.SouthOf, domains: ["spatial"], asPP: ["north of"], asVerb: [] },
    [RelationKey.SouthOf]: { opposite: RelationKey.NorthOf, domains: ["spatial"], asPP: ["south of"], asVerb: [] },
    [RelationKey.EastOf]: { opposite: RelationKey.WestOf, domains: ["spatial"], asPP: ["east of"], asVerb: [] },
    [RelationKey.WestOf]: { opposite: RelationKey.EastOf, domains: ["spatial"], asPP: ["west of"], asVerb: [] },
    [RelationKey.Inside]: { opposite: RelationKey.Outside, domains: ["spatial"], asPP: ["inside"], asVerb: ["contains", "encloses"] },
    [RelationKey.Outside]: { opposite: RelationKey.Inside, domains: ["spatial"], asPP: ["outside"], asVerb: ["excludes"] },
    [RelationKey.Between]: { domains: ["spatial"], asPP: ["between"], asVerb: [] },
    [RelationKey.Beside]: { domains: ["spatial"], asPP: ["beside"], asVerb: ["abuts"] },
    [RelationKey.Near]: { opposite: RelationKey.Far, domains: ["spatial"], asPP: ["near", "close to"], asVerb: ["approaches"] },
    [RelationKey.Far]: { opposite: RelationKey.Near, domains: ["spatial"], asPP: ["far from", "distant from"], asVerb: ["recedes from"] },
    [RelationKey.AdjacentTo]: { domains: ["spatial"], asPP: ["adjacent to", "next to"], asVerb: ["borders", "adjoins"] },
    [RelationKey.AcrossFrom]: { domains: ["spatial"], asPP: ["across from"], asVerb: [] },
    [RelationKey.On]: { domains: ["spatial"], asPP: ["on"], asVerb: ["rests on", "sits on"] },
    [RelationKey.Under]: { domains: ["spatial"], asPP: ["under", "beneath"], asVerb: ["supports", "is under"] },

    [RelationKey.ConnectedTo]: { opposite: RelationKey.DisconnectedFrom, domains: ["graph"], asPP: ["connected to", "linked to"], asVerb: ["connects to", "links to", "joins"] },
    [RelationKey.DisconnectedFrom]: { opposite: RelationKey.ConnectedTo, domains: ["graph"], asPP: ["disconnected from", "separate from"], asVerb: ["disconnects from", "separates from"] },

    [RelationKey.Confirms]: { opposite: RelationKey.Refutes, domains: ["generic"], asPP: ["confirmed by"], asVerb: ["confirms", "corroborates", "supports"] },
    [RelationKey.Refutes]: { opposite: RelationKey.Confirms, domains: ["generic"], asPP: ["refuted by"], asVerb: ["refutes", "contradicts", "disproves"] },
    [RelationKey.Supports]: { opposite: RelationKey.Undermines, domains: ["generic"], asPP: ["supported by"], asVerb: ["supports", "bolsters", "reinforces"] },
    [RelationKey.Undermines]: { opposite: RelationKey.Supports, domains: ["generic"], asPP: ["undermined by"], asVerb: ["undermines", "weakens", "erodes"] },

    [RelationKey.Causes]: { opposite: RelationKey.CausedBy, domains: ["causal"], asPP: ["causal for", "a cause of"], asVerb: ["causes", "produces", "brings about"] },
    [RelationKey.CausedBy]: { opposite: RelationKey.Causes, domains: ["causal"], asPP: ["caused by"], asVerb: ["is caused by"] },
    [RelationKey.Enables]: { opposite: RelationKey.Inhibits, domains: ["causal"], asPP: ["enabling of"], asVerb: ["enables", "facilitates", "permits"] },
    [RelationKey.Inhibits]: { opposite: RelationKey.Enables, domains: ["causal"], asPP: ["inhibiting of"], asVerb: ["inhibits", "prevents", "impedes"] },
    [RelationKey.Implies]: { opposite: RelationKey.Contradicts, domains: ["generic"], asPP: ["implied by"], asVerb: ["implies", "entails"] },
    [RelationKey.Contradicts]: { opposite: RelationKey.Implies, domains: ["generic"], asPP: ["contradicted by"], asVerb: ["contradicts", "is incompatible with"] }
};

export function pickKeyForType(type: EnumQuestionType, positive: boolean) {
    switch (type) {
        case EnumQuestionType.Distinction:
            return positive ? RelationKey.SameAs : RelationKey.DifferentFrom;
        case EnumQuestionType.ComparisonNumerical:
            return positive ? RelationKey.GreaterThan : RelationKey.LessThan;
        case EnumQuestionType.ComparisonChronological:
            return positive ? RelationKey.After : RelationKey.Before;
        case EnumQuestionType.Direction:
            return positive ? RelationKey.NorthOf : RelationKey.SouthOf;
        case EnumQuestionType.Direction3DSpatial:
            return positive ? RelationKey.Above : RelationKey.Below;
        case EnumQuestionType.Direction3DTemporal:
            return positive ? RelationKey.DownstreamOf : RelationKey.UpstreamOf;
        case EnumQuestionType.GraphMatching:
            return positive ? RelationKey.ConnectedTo : RelationKey.DisconnectedFrom;
        case EnumQuestionType.Analogy:
            return positive ? RelationKey.SameAs : RelationKey.DifferentFrom;
        case EnumQuestionType.Binary:
            return positive ? RelationKey.Confirms : RelationKey.Refutes;
        case EnumQuestionType.InclusionExclusion:
            return positive ? RelationKey.Inside : RelationKey.Outside;
        default:
            return positive ? RelationKey.SameAs : RelationKey.DifferentFrom;
    }
}

export function renderRelation(key: RelationKey, preferVerb = false) {
    const e = RELATIONS[key];
    const useVerb = preferVerb && e.asVerb.length > 0;
    const text = useVerb ? pick(e.asVerb) : pick(e.asPP);
    return { text, needsCopula: !useVerb, key } as { text: string, needsCopula: boolean, key: RelationKey };
}


