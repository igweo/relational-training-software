import { FORMS, NOUNS, NUMBER_WORDS, STRINGS, VALID_RULES, NOT_STRINGS } from "../constants/question.constants";
import { EnumArrangements, EnumQuestionType } from "../constants/question.constants";
import { IArrangementPremise, IArrangementRelationship, Question } from "../models/question.models";
import { Settings, Picked } from "../models/settings.models";

// Conclusion diversification strategies to prevent pattern memorization
export enum ConclusionDiversificationStrategy {
    ENDPOINT_TRADITIONAL = "endpoint_traditional",     // Current behavior - test endpoints
    INTERMEDIATE_CHAIN = "intermediate_chain",         // Test middle elements in chain
    REVERSE_DIRECTION = "reverse_direction",           // Test same relationship in reverse
    MULTI_HOP_SKIP = "multi_hop_skip",                // Skip elements in chain testing
    PREMISE_RESTATEMENT = "premise_restatement",       // Test relationships explicitly stated
    ADJACENT_PAIRS = "adjacent_pairs",                 // Test adjacent elements in sequence
    RANDOM_PAIR = "random_pair"                        // Test completely random valid pair
}

export const b2n = (b: boolean) => +b as number;

export function genBinKey(booleans: boolean[]) {
    return booleans.map(value => (value ? '1' : '0')).join('');
}

export function coinFlip() {
    return Math.random() > 0.5;
}

export function pickUniqueItems<T>(array: T[], n: number): Picked<T> {
    const copy = [...array];
    const picked = [];
    while (n > 0) {
        const rnd = Math.floor(Math.random() * copy.length);
        picked.push(copy.splice(rnd, 1)[0]);
        n--;
    }
    return { picked, remaining: copy };
}

export function shuffle<T>(array: T[]) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

export function getRandomRuleValid() {
    return VALID_RULES[Math.floor(Math.random() * VALID_RULES.length)];
}

export function getRandomRuleInvalid() {
    let rule;
    while (!rule || VALID_RULES.includes(rule)) {
        rule = "";
        for (let i = 0; i < 3; i++) {
            rule += Math.floor(Math.random() * 4); // Form
        }
        rule += 1 + Math.floor(Math.random() * 4); // Figure
    }
    return rule;
}

export function extractSubjects(phrase: string) {
    return [...phrase.matchAll(/<span class="subject">(.*?)<\/span>/g)].map(a => a[1]);
}

export function isPremiseLikeConclusion(premises: string[], conclusion: string) {
    const subjectsOfPremises = premises.map(p => extractSubjects(p));
    const subjectsOfConclusion = extractSubjects(conclusion);
    for (const subjects of subjectsOfPremises) {
        const toCompare = subjectsOfConclusion[0] + subjectsOfConclusion[1];
        if (subjects[0] + subjects[1] === toCompare || subjects[1] + subjects[0] === toCompare)
            return true;
    }
    return false;
}

export function getSymbols(settings: Settings) {
    if (settings.enabled.visualMode) {
        return [...NOT_STRINGS];
    }
    return settings.enabled.meaningfulWords ? [...NOUNS] : [...STRINGS];
}

export function getRandomSymbols(settings: Settings, length: number) {
    const symbols = getSymbols(settings);
    const seen = new Set();
    return Array(length).fill(0)
        .map(() => {
            let rnd = Math.floor(Math.random() * symbols.length);
            while (seen.has(rnd)) {
                rnd = Math.floor(Math.random() * symbols.length);
            }
            seen.add(rnd);
            return symbols[rnd];
        });
}

export function getSyllogism(settings: Settings, s: string, p: string, m: string, rule: string) {

    const _forms = (!settings.enabled.negation)
        ? FORMS[0]
        : pickUniqueItems(FORMS, 1).picked[0];

    let major = _forms[+rule[0]];
    let minor = _forms[+rule[1]];
    let conclusion = _forms[+rule[2]];

    const figure = +rule[3];
    switch (figure) {
        case 1:
            major = major.replace("$", m);
            major = major.replace("$", p);
            minor = minor.replace("$", s);
            minor = minor.replace("$", m);
            break;
        case 2:
            major = major.replace("$", p);
            major = major.replace("$", m);
            minor = minor.replace("$", s);
            minor = minor.replace("$", m);
            break;
        case 3:
            major = major.replace("$", m);
            major = major.replace("$", p);
            minor = minor.replace("$", m);
            minor = minor.replace("$", s);
            break;
        case 4:
            major = major.replace("$", p);
            major = major.replace("$", m);
            minor = minor.replace("$", m);
            minor = minor.replace("$", s);
            break;
    }

    conclusion = conclusion.replace("$", s);
    conclusion = conclusion.replace("$", p);

    return [major, minor, conclusion];
}

export function getMetaReplacer(settings: Settings, choosenPair: Picked<string>, relations: string[], negations: boolean[]) {
    const choosenSubjects = [...choosenPair.picked[0].matchAll(/<span class="subject">(.*?)<\/span>/g)];
    const [a, b] = choosenSubjects.map(m => m[1]);

    const isSameAs = (relations[0] === relations[1]) === (negations[0] === negations[1]);
    const relation = getRelation(settings, EnumQuestionType.Distinction, isSameAs);

    return `$1 ${relation} (<span class="subject">${a}</span> to <span class="subject">${b}</span>) to `;
}
export const expressionVariants = {
  Distinction: {
      /* "Same / not‑same" – identity and equivalence relationships */
      positive: [
          "equivalent to", "identical to", "congruent to", "the same as", "equal to",
          "tantamount to", "analogous to", "correspondent to", "commensurate with",
          "coincident with", "coextensive with", "synonymous with", "interchangeable with",
          "indistinguishable from", "on par with", "aligned with", "consistent with",
          "homologous to", "isomorphic to", "parallel to", "correlative to",
          "proportional to", "reciprocal to", "complementary to", "concomitant with",
          /* fixed relative‑clause variants */
          "identical to", "synonymous with", "interchangeable with"
      ],
      negative: [
          "distinct from", "different from", "dissimilar to", "contrary to", "opposite to",
          "divergent from", "disparate from", "incompatible with", "incongruent with",
          "antithetical to", "contradictory to", "inverse to", "discordant with",
          "heterogeneous to", "incommensurable with", "disproportionate to", "asymmetric to",
          "orthogonal to", "mutually exclusive with", "at variance with", "at odds with",
          "not equivalent to", "not identical to", "not analogous to", "not correspondent to",
          /* fixed relative‑clause variants */
          "distinct from", "divergent from", "differentiated from"
      ]
  },

  ComparisonNumerical: {
      /* "Greater / lesser" – quantitative magnitude relationships */
      positive: [
          "greater than", "larger than", "higher than", "superior to", "above",
          "in excess of", "beyond", "over", "exceeding", "surpassing",
          "predominant over", "dominant over", "transcendent to", "paramount to",
          "more substantial than", "more significant than", "more extensive than",
          "more considerable than", "more pronounced than", "more abundant than",
          "more voluminous than", "more capacious than", "more comprehensive than",
          /* fixed relative‑clause variants */
          "above", "higher than", "greater than"
      ],
      negative: [
          "less than", "smaller than", "lower than", "inferior to", "below",
          "under", "beneath", "subordinate to", "secondary to", "minor to",
          "subsidiary to", "subservient to", "diminished relative to", "reduced compared to",
          "more limited than", "more restricted than", "more constrained than",
          "more modest than", "more minimal than", "more negligible than",
          "more marginal than", "more superficial than", "more cursory than",
          /* fixed relative‑clause variants */
          "below", "lower than", "less than"
      ]
  },

  ComparisonChronological: {
      /* "Later / earlier" – temporal sequence relationships */
      positive: [
          "after", "later than", "subsequent to", "following", "posterior to",
          "succeeding", "ensuing", "consequent to", "in the wake of", "downstream from",
          "post", "beyond", "ahead of", "forward of", "advanced relative to",
          "more recent than", "more contemporary than", "more modern than",
          "more current than", "more up‑to‑date than", "more progressive than",
          "chronologically superior to", "temporally advanced beyond",
          /* fixed relative‑clause variants */
          "after", "following", "subsequent to", "later than"
      ],
      negative: [
          "before", "earlier than", "prior to", "preceding", "anterior to",
          "antecedent to", "preliminary to", "preparatory to", "upstream from",
          "pre", "in advance of", "prefatory to",
          "more ancient than", "more archaic than", "more primitive than",
          "more antiquated than", "more obsolete than", "more outdated than",
          "chronologically inferior to", "temporally behind",
          /* fixed relative‑clause variants */
          "before", "prior to", "preceding"
      ]
  },

  Direction: {
      /* Spatial directional relationships */
      positive: [
          "north of", "northward from", "to the north of", "in a northerly direction from",
          "above", "upward from", "higher than", "elevated relative to",
          "superior in position to", "overhead relative to", "ascending from",
          /* fixed relative‑clause variants */
          "moving toward", "directed toward", "positioned above", "ascending over"
      ],
      negative: [
          "south of", "southward from", "to the south of", "in a southerly direction from",
          "below", "downward from", "lower than", "beneath", "under",
          "inferior in position to", "underneath", "descending from",
          /* fixed relative‑clause variants */
          "moving away from", "positioned away from", "situated below", "descending under"
      ]
  },

  Direction3DSpatial: {
      /* Three‑dimensional spatial relationships */
      positive: [
          "above and forward of", "elevated and ahead of", "superior and anterior to",
          "higher and in front of", "overhead and before", "ascending and preceding",
          "upward and forward from", "vertically and horizontally advanced from",
          /* fixed relative‑clause variants */
          "positioned above and ahead of", "elevated over and before"
      ],
      negative: [
          "below and behind", "beneath and posterior to", "under and following",
          "lower and after", "underneath and subsequent to", "descending and trailing",
          "downward and backward from", "vertically and horizontally receding from",
          /* fixed relative‑clause variants */
          "positioned below and behind", "situated under and after"
      ]
  },

  Direction3DTemporal: {
      /* Temporal relationships with spatial aspect */
      positive: [
          "chronologically and spatially advanced from", "temporally and positionally ahead of",
          "later and higher than", "subsequent and superior to", "following and above",
          "ensuing and elevated relative to", "posterior and ascending from",
          /* fixed relative‑clause variants */
          "positioned later and above", "temporally after and above"
      ],
      negative: [
          "chronologically and spatially behind", "temporally and positionally below",
          "earlier and lower than", "prior and inferior to", "preceding and beneath",
          "antecedent and descending from", "anterior and declining relative to",
          /* fixed relative‑clause variants */
          "positioned earlier and below", "temporally prior and beneath"
      ]
  },

  GraphMatching: {
      /* Network and connection relationships */
      positive: [
          "connected to", "linked with", "joined to", "associated with", "coupled to",
          "bound to", "affiliated with", "related to", "corresponding to",
          "networked with", "interfaced with", "bridged to", "tethered to",
          "correlated with", "synchronized with", "coordinated with",
          /* fixed relative‑clause variants */
          "connected to", "interfaced with", "communicating through"
      ],
      negative: [
          "disconnected from", "unlinked to", "separated from", "isolated from",
          "detached from", "independent of", "unrelated to", "dissociated from",
          "unaffiliated with", "uncoupled from", "autonomous relative to",
          "discrete from", "uncoordinated with", "asynchronous with",
          /* fixed relative‑clause variants */
          "disconnected from", "isolated from"
      ]
  },

  Analogy: {
      /* Relationship comparison expressions */
      positive: [
          "relates to", "corresponds to", "parallels", "mirrors the relationship of",
          "exhibits the same pattern as", "demonstrates similarity to", "reflects",
          "echoes the connection between", "replicates the association of",
          "emulates the relationship between", "follows the same logic as",
          /* fixed relative‑clause variants */
          "analogous to", "correspondent to"
      ],
      negative: [
          "contrasts with", "differs from", "opposes the relationship of",
          "contradicts the pattern of", "inverts the connection between",
          "reverses the association of", "negates the relationship between",
          "stands contrary to", "diverges from the logic of",
          /* fixed relative‑clause variants */
          "divergent from", "departing from"
      ]
  },

  Binary: {
      /* Logical validation relationships */
      positive: [
          "affirms", "confirms", "validates", "verifies", "substantiates",
          "corroborates", "establishes", "demonstrates", "proves",
          "authenticates", "certifies", "endorses", "supports",
          /* fixed relative‑clause variants */
          "verified by", "confirmed by"
      ],
      negative: [
          "negates", "refutes", "contradicts", "disproves", "invalidates",
          "falsifies", "contravenes", "opposes", "disputes", "challenges",
          "undermines", "discredits", "repudiates", "denies",
          /* fixed relative‑clause variants */
          "refuted by", "falsified by"
      ]
  }
};
const randomFrom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

// Conclusion diversification helper functions
export function selectDiversificationStrategy(questionType: EnumQuestionType, numElements: number): ConclusionDiversificationStrategy {
    const availableStrategies: ConclusionDiversificationStrategy[] = [
        ConclusionDiversificationStrategy.ENDPOINT_TRADITIONAL,
        ConclusionDiversificationStrategy.RANDOM_PAIR
    ];

    // Add strategies based on question type and complexity
    if (numElements >= 3) {
        availableStrategies.push(
            ConclusionDiversificationStrategy.INTERMEDIATE_CHAIN,
            ConclusionDiversificationStrategy.REVERSE_DIRECTION
        );
    }

    if (numElements >= 4) {
        availableStrategies.push(
            ConclusionDiversificationStrategy.MULTI_HOP_SKIP,
            ConclusionDiversificationStrategy.ADJACENT_PAIRS
        );
    }

    // Some strategies work better for certain question types
    if (questionType === EnumQuestionType.Distinction || 
        questionType === EnumQuestionType.ComparisonNumerical || 
        questionType === EnumQuestionType.ComparisonChronological) {
        availableStrategies.push(ConclusionDiversificationStrategy.PREMISE_RESTATEMENT);
    }

    return randomFrom(availableStrategies) as ConclusionDiversificationStrategy;
}

export function diversifyDistinctionConclusion(
    settings: Settings, 
    type: EnumQuestionType, 
    buckets: string[][], 
    allElements: string[],
    strategy?: ConclusionDiversificationStrategy
): { conclusion: string, isValid: boolean } {
    const selectedStrategy = strategy || selectDiversificationStrategy(type, allElements.length);
    
    switch (selectedStrategy) {
        case ConclusionDiversificationStrategy.INTERMEDIATE_CHAIN: {
            // Test elements from middle of the chain instead of endpoints
            const bucket0Middle = buckets[0].slice(1, -1);
            const bucket1Middle = buckets[1].slice(1, -1);
            
            if (bucket0Middle.length > 0 && bucket1Middle.length > 0) {
                const elem1 = randomFrom(bucket0Middle);
                const elem2 = randomFrom(bucket1Middle);
                const isSameAs = coinFlip();
                const relation = getRelation(settings, type, isSameAs);
                
                return {
                    conclusion: `<span class="subject">${elem1}</span> is ${relation} <span class="subject">${elem2}</span>`,
                    isValid: !isSameAs // Different buckets, so "same" should be false
                };
            }
            // Fallback to traditional if no middle elements
            break;
        }
        
        case ConclusionDiversificationStrategy.REVERSE_DIRECTION: {
            // Test relationship in reverse order
            const elem1 = randomFrom([...buckets[0], ...buckets[1]]);
            const elem2 = randomFrom([...buckets[0], ...buckets[1]]);
            
            if (elem1 !== elem2) {
                const isSameAs = coinFlip();
                const relation = getRelation(settings, type, isSameAs);
                const actualSame = (buckets[0].includes(elem1) && buckets[0].includes(elem2)) ||
                                 (buckets[1].includes(elem1) && buckets[1].includes(elem2));
                
                return {
                    conclusion: `<span class="subject">${elem2}</span> is ${relation} <span class="subject">${elem1}</span>`,
                    isValid: isSameAs === actualSame
                };
            }
            break;
        }
        
        case ConclusionDiversificationStrategy.PREMISE_RESTATEMENT: {
            // Sometimes test a relationship that's explicitly stated in premises
            // This should always be TRUE
            const bucket = coinFlip() ? buckets[0] : buckets[1];
            if (bucket.length >= 2) {
                const [elem1, elem2] = pickUniqueItems(bucket, 2).picked;
                const relation = getRelation(settings, type, true); // Same bucket = same
                
                return {
                    conclusion: `<span class="subject">${elem1}</span> is ${relation} <span class="subject">${elem2}</span>`,
                    isValid: true
                };
            }
            break;
        }
        
        case ConclusionDiversificationStrategy.RANDOM_PAIR: {
            // Test completely random pair
            const [elem1, elem2] = pickUniqueItems(allElements, 2).picked;
            const isSameAs = coinFlip();
            const relation = getRelation(settings, type, isSameAs);
            const actualSame = (buckets[0].includes(elem1) && buckets[0].includes(elem2)) ||
                             (buckets[1].includes(elem1) && buckets[1].includes(elem2));
            
            return {
                conclusion: `<span class="subject">${elem1}</span> is ${relation} <span class="subject">${elem2}</span>`,
                isValid: isSameAs === actualSame
            };
        }
    }
    
    // Fallback to traditional endpoint testing
    const first = allElements[0];
    const last = allElements[allElements.length - 1];
    const isSameAs = coinFlip();
    const relation = getRelation(settings, type, isSameAs);
    const actualSame = (buckets[0].includes(first) && buckets[0].includes(last)) ||
                      (buckets[1].includes(first) && buckets[1].includes(last));
    
    return {
        conclusion: `<span class="subject">${first}</span> is ${relation} <span class="subject">${last}</span>`,
        isValid: isSameAs === actualSame
    };
}

export function diversifyComparisonConclusion(
    settings: Settings,
    type: EnumQuestionType,
    orderedElements: string[],
    sign: number,
    strategy?: ConclusionDiversificationStrategy
): { conclusion: string, isValid: boolean } {
    const selectedStrategy = strategy || selectDiversificationStrategy(type, orderedElements.length);
    
    switch (selectedStrategy) {
        case ConclusionDiversificationStrategy.ADJACENT_PAIRS: {
            // Test adjacent elements in the sequence
            if (orderedElements.length >= 2) {
                const startIdx = Math.floor(Math.random() * (orderedElements.length - 1));
                const elem1 = orderedElements[startIdx];
                const elem2 = orderedElements[startIdx + 1];
                
                const isMoreOrAfter = coinFlip();
                const relation = getRelation(settings, type, isMoreOrAfter);
                
                // For adjacent elements, the relationship depends on sign and order
                const actualMore = sign === 1 ? startIdx < startIdx + 1 : startIdx > startIdx + 1;
                
                return {
                    conclusion: `<span class="subject">${elem1}</span> is ${relation} <span class="subject">${elem2}</span>`,
                    isValid: isMoreOrAfter === actualMore
                };
            }
            break;
        }
        
        case ConclusionDiversificationStrategy.MULTI_HOP_SKIP: {
            // Skip elements in the chain (e.g., test A vs C instead of A vs B)
            if (orderedElements.length >= 3) {
                const skipDistance = 1 + Math.floor(Math.random() * Math.floor(orderedElements.length / 2));
                const startIdx = Math.floor(Math.random() * (orderedElements.length - skipDistance));
                const endIdx = startIdx + skipDistance;
                
                const elem1 = orderedElements[startIdx];
                const elem2 = orderedElements[endIdx];
                
                const isMoreOrAfter = coinFlip();
                const relation = getRelation(settings, type, isMoreOrAfter);
                
                const actualMore = sign === 1 ? startIdx < endIdx : startIdx > endIdx;
                
                return {
                    conclusion: `<span class="subject">${elem1}</span> is ${relation} <span class="subject">${elem2}</span>`,
                    isValid: isMoreOrAfter === actualMore
                };
            }
            break;
        }
        
        case ConclusionDiversificationStrategy.REVERSE_DIRECTION: {
            // Test the relationship in reverse order
            const a = Math.floor(Math.random() * orderedElements.length);
            let b = Math.floor(Math.random() * orderedElements.length);
            while (a === b) {
                b = Math.floor(Math.random() * orderedElements.length);
            }
            
            const isMoreOrAfter = coinFlip();
            const relation = getRelation(settings, type, isMoreOrAfter);
            
            // Reverse the elements
            const elem1 = orderedElements[b];
            const elem2 = orderedElements[a];
            
            const actualMore = sign === 1 ? b > a : b < a;
            
            return {
                conclusion: `<span class="subject">${elem1}</span> is ${relation} <span class="subject">${elem2}</span>`,
                isValid: isMoreOrAfter === actualMore
            };
        }
    }
    
    // Fallback to current random pair selection
    const a = Math.floor(Math.random() * orderedElements.length);
    let b = Math.floor(Math.random() * orderedElements.length);
    while (a === b) {
        b = Math.floor(Math.random() * orderedElements.length);
    }
    
    const isMoreOrAfter = coinFlip();
    const relation = getRelation(settings, type, isMoreOrAfter);
    
    return {
        conclusion: `<span class="subject">${orderedElements[a]}</span> is ${relation} <span class="subject">${orderedElements[b]}</span>`,
        isValid: isMoreOrAfter
            ? sign === 1 && a > b || sign === -1 && a < b
            : sign === 1 && a < b || sign === -1 && a > b
    };
}

export function getRelation(settings: Settings, type: EnumQuestionType, isPositive: boolean) {
    let positive = "";
    let negative = "";

    switch (type) {
        case EnumQuestionType.Distinction:
            positive = randomFrom(expressionVariants.Distinction.positive);
            negative = randomFrom(expressionVariants.Distinction.negative);
            break;
        case EnumQuestionType.ComparisonNumerical:
            positive = randomFrom(expressionVariants.ComparisonNumerical.positive);
            negative = randomFrom(expressionVariants.ComparisonNumerical.negative);
            break;
        case EnumQuestionType.ComparisonChronological:
            positive = randomFrom(expressionVariants.ComparisonChronological.positive);
            negative = randomFrom(expressionVariants.ComparisonChronological.negative);
            break;
        case EnumQuestionType.Direction:
            positive = randomFrom(expressionVariants.Direction.positive);
            negative = randomFrom(expressionVariants.Direction.negative);
            break;
        case EnumQuestionType.Direction3DSpatial:
            positive = randomFrom(expressionVariants.Direction3DSpatial.positive);
            negative = randomFrom(expressionVariants.Direction3DSpatial.negative);
            break;
        case EnumQuestionType.Direction3DTemporal:
            positive = randomFrom(expressionVariants.Direction3DTemporal.positive);
            negative = randomFrom(expressionVariants.Direction3DTemporal.negative);
            break;
        case EnumQuestionType.GraphMatching:
            positive = randomFrom(expressionVariants.GraphMatching.positive);
            negative = randomFrom(expressionVariants.GraphMatching.negative);
            break;
        case EnumQuestionType.Analogy:
            positive = randomFrom(expressionVariants.Analogy.positive);
            negative = randomFrom(expressionVariants.Analogy.negative);
            break;
        case EnumQuestionType.Binary:
            positive = randomFrom(expressionVariants.Binary.positive);
            negative = randomFrom(expressionVariants.Binary.negative);
            break;
        default:
            // Fallback for any unhandled question types
            positive = "related to";
            negative = "unrelated to";
            break;
    }

    let relation = isPositive ? positive : negative;
    if (settings.enabled.negation && coinFlip()) {
        switch (relation) {
            case positive:
                relation = `<span class="is-negated">${negative}</span>`;
                break;
            case negative:
                relation = `<span class="is-negated">${positive}</span>`;
                break;
        }
    }
    return relation;
}
export function createMetaRelationships(settings: Settings, question: Question, length: number) {
    // Substitute a variable number of premises with meta-relations
    if (settings.enabled.meta && coinFlip()) {
        const numOfMetaRelationships = 1 + Math.floor(Math.random() * Math.floor((length - 1) / 2));
        question.metaRelations += numOfMetaRelationships;

        let subjects: { value: number, subject: string }[] = [];
        if (question.type === EnumQuestionType.Distinction) {
            subjects = question.buckets.reduce((a, c, i) => [...a, ...c.map(b => ({ value: i, subject: b[0] }))], [] as typeof subjects);
        } else {
            subjects = question.bucket.map((c, i, a) => ({ value: (a.length - i), subject: c }), []);
        }

        const { picked: pickedPremises, remaining: remainingPremises } = pickUniqueItems(question.premises, numOfMetaRelationships);
        const pickedPremisesSubjects = pickedPremises.map(extractSubjects);
        const remainingPremisesSubjects = remainingPremises.map(extractSubjects);
        const bidirectionalRelationshipMap = remainingPremisesSubjects.reduce((acc, [a, b]) => (acc[a] = acc[a] || [], acc[a].push(b), acc[b] = acc[b] || [], acc[b].push(a), acc), {} as { [key: string]: string[] });
        const newPremises = [];
        for (const premiseSubjects of pickedPremisesSubjects) {
            const [a, b] = premiseSubjects.map(ps => subjects.find(s => ps === s.subject)!);
            const { picked } = pickUniqueItems(Object.entries(bidirectionalRelationshipMap), 1);
            let _c = "";
            let _d = "";
            if (picked[0][1].length > 1) { // Indirect relation
                _c = picked[0][1][0];
                _d = picked[0][1][1];
            } else {
                _c = picked[0][0]; // Direct relation
                _d = picked[0][1][0];
            }
            const c = subjects.find(s => s.subject === _c)!;
            const d = subjects.find(s => s.subject === _d)!;

            let isSame = false;
            if (question.type === EnumQuestionType.Distinction) {
                isSame = (a.value === b.value) === (c.value === d.value);
            } else {
                isSame = (a.value < b.value) === (c.value < d.value);
            }

            if (isSame) { // Same
                if (settings.enabled.negation && coinFlip()) {
                    newPremises.push(`<span class="subject">${a.subject}</span> relates to <span class="subject">${b.subject}</span> in the <span class="is-negated">opposite</span> way that <span class="subject">${c.subject}</span> relates to <span class="subject">${d.subject}</span>`);
                } else {
                    newPremises.push(`<span class="subject">${a.subject}</span> relates to <span class="subject">${b.subject}</span> in the same way that <span class="subject">${c.subject}</span> relates to <span class="subject">${d.subject}</span>`);
                }
            } else { // Different
                if (settings.enabled.negation && coinFlip()) {
                    newPremises.push(`<span class="subject">${a.subject}</span> relates to <span class="subject">${b.subject}</span> in the <span class="is-negated">same</span> way that <span class="subject">${c.subject}</span> relates to <span class="subject">${d.subject}</span>`);
                } else {
                    newPremises.push(`<span class="subject">${a.subject}</span> relates to <span class="subject">${b.subject}</span> in the opposite way that <span class="subject">${c.subject}</span> relates to <span class="subject">${d.subject}</span>`);
                }
            }
        }

        newPremises.push(...remainingPremises);
        question.premises = newPremises;
    }
}

/** This methods modifies some premises with meta-relationships */
export function metarelateArrangement(premises: IArrangementPremise[]) {
    premises.forEach(premise => {
        premise.metaRelationships = premises
            .filter(p => p.uid !== premise.uid)
            .filter(p => p.relationship.description === premise.relationship.description && p.relationship.steps === premise.relationship.steps);
    });
}

export function horizontalShuffleArrangement(premises: IArrangementPremise[]) {
    const switchSubjects = (premise: IArrangementPremise) =>
        [premise.a, premise.b] = [premise.b, premise.a];

    premises.forEach(premise => {
        if (premise.relationship && coinFlip()) {
            switch (premise.relationship.description) {
                case EnumArrangements.AdjacentLeft: {
                    premise.relationship.description = EnumArrangements.AdjacentRight;
                    switchSubjects(premise);
                    break;
                }
                case EnumArrangements.AdjacentRight: {
                    premise.relationship.description = EnumArrangements.AdjacentLeft;
                    switchSubjects(premise);
                    break;
                }
                case EnumArrangements.NStepsLeft: {
                    premise.relationship.description = EnumArrangements.NStepsRight;
                    switchSubjects(premise);
                    break;
                }
                case EnumArrangements.NStepsRight: {
                    premise.relationship.description = EnumArrangements.NStepsLeft;
                    switchSubjects(premise);
                    break;
                }
                case EnumArrangements.Next: {
                    switchSubjects(premise);
                    break;
                }
                case EnumArrangements.InFront: {
                    switchSubjects(premise);
                    break;
                }
                case EnumArrangements.Left: {
                    premise.relationship.description = EnumArrangements.Right;
                    switchSubjects(premise);
                    break;
                }
                case EnumArrangements.Right: {
                    premise.relationship.description = EnumArrangements.Left;
                    switchSubjects(premise);
                    break;
                }
            }
        }
    });
}

export function getLinearWays(
    i: number,
    j: number,
    _: number,
    forConclusion = false,
    precise = false
) {
    const isAdjLeft = i + 1 === j;
    const isAdjRight = i - 1 === j;
    const isNext = isAdjLeft || isAdjRight;
    const isLeft = i < j;
    const isRight = i > j;
    const steps = Math.abs(i - j);

    const ways: Record<string, { possible: boolean, steps: number }> = {
        [EnumArrangements.AdjacentLeft]: {
            possible: isAdjLeft,
            steps
        },
        [EnumArrangements.AdjacentRight]: {
            possible: isAdjRight,
            steps
        },
        [EnumArrangements.NStepsLeft]: {
            possible: isLeft,
            steps
        },
        [EnumArrangements.NStepsRight]: {
            possible: isRight,
            steps
        },
    };

    if (forConclusion) {
        ways[EnumArrangements.Next] = {
            possible: isNext,
            steps
        };
        if (!precise) {
            ways[EnumArrangements.Left] = {
                possible: isLeft,
                steps: -Infinity
            };
            ways[EnumArrangements.Right] = {
                possible: isRight,
                steps: -Infinity
            };
        }
    }

    return ways;
};

export function getCircularWays(
    i: number,
    j: number,
    numOfEls: number,
    forConclusion = false,
    precise = false
) {
    const getAdjLeft = (i: number) => (numOfEls + (i + 1)) % numOfEls;
    const getAdjRight = (i: number) => (numOfEls + (i - 1)) % numOfEls;
    const getInFront = (i: number) => (i + (numOfEls / 2)) % numOfEls;
    const getCWDist = (i: number, j: number) => (j - i + numOfEls) % numOfEls;
    const getCCWDist = (i: number, j: number) => numOfEls - getCWDist(i, j);

    // Set i to 0 and calc j relative to that
    j = (numOfEls + (j - i)) % numOfEls;
    i = 0;

    const isAdjLeft = getAdjLeft(i) === j;
    const isAdjRight = getAdjRight(i) === j;
    const isNext = isAdjLeft || isAdjRight;
    const isLeft = j < getInFront(i);
    const isRight = j > getInFront(i);
    const steps = Math.min(getCWDist(i, j), getCCWDist(i, j));

    const ways: Record<string, { possible: boolean, steps: number }> = {
        [EnumArrangements.AdjacentLeft]: {
            possible: isAdjLeft,
            steps
        },
        [EnumArrangements.AdjacentRight]: {
            possible: isAdjRight,
            steps
        },
        [EnumArrangements.NStepsLeft]: {
            possible: isLeft || steps === (numOfEls / 2),
            steps
        },
        [EnumArrangements.NStepsRight]: {
            possible: isRight || steps === (numOfEls / 2),
            steps
        },
    };

    // Even num of els do have diametrically opposite els
    if (numOfEls % 2 === 0) {
        ways[EnumArrangements.InFront] = {
            possible: getInFront(i) === j,
            steps
        };
    }

    if (forConclusion) {
        ways[EnumArrangements.Next] = {
            possible: isNext,
            steps
        };
        if (!precise) {
            ways[EnumArrangements.Left] = {
                possible: isLeft,
                steps: -Infinity
            };
            ways[EnumArrangements.Right] = {
                possible: isRight,
                steps: -Infinity
            };
        }
    }

    return ways;
};

export function interpolateArrangementRelationship(relationship: IArrangementRelationship, settings: Settings) {
    const numWord = NUMBER_WORDS[relationship.steps];

    const interpolatedWithSteps = relationship.description.replace(/# steps/, () =>
        relationship.steps === 1
            ? " adjacent and"
            : ((numWord || relationship.steps) + " steps")
    );

    if (settings.enabled.negation && coinFlip()) {
        // TODO: This method should return the number of negations applied
        return interpolatedWithSteps.replaceAll(/(left|right)/gi, substr =>
            `<span class="is-negated">${(substr === "left") ? "right" : "left"}</span>`
        );
    }

    return interpolatedWithSteps;
}

export function fixBinaryInstructions(q: Question) {
    const htmlify = (rule: string) => rule.split(", ").map(str => `<span class="subject">${str}</span>`).join(", ");
    switch (q.type) {
        case EnumQuestionType.LinearArrangement: {
            return htmlify(q.rule) + " are arranged in a <b>linear</b> way.";
        }
        case EnumQuestionType.CircularArrangement: {
            return htmlify(q.rule) + " are arranged in a <b>circular</b> way.";
        }
        default: {
            return "";
        }
    }
}

function buildGraph(edgeList: [string, "↔" | "→" | "←", string][]) {
    const graph = {} as Record<string, { out: Set<string>, in: Set<string> }>;
    edgeList.forEach(edge => {
        const [u, symbol, v] = edge;
        if (!graph[u]) graph[u] = { out: new Set(), in: new Set() };
        if (!graph[v]) graph[v] = { out: new Set(), in: new Set() };
        if (symbol === "→") {
            graph[u].out.add(v);
            graph[v].in.add(u);
        } else if (symbol === "←") {
            graph[v].out.add(u);
            graph[u].in.add(v);
        } else if (symbol === "↔") {
            // Bidirectional: add edges in both directions
            graph[u].out.add(v);
            graph[u].in.add(v);
            graph[v].out.add(u);
            graph[v].in.add(u);
        }
    });
    return graph;
}

// Checks if two directed graphs (given as edge lists) are isomorphic
export function areGraphsIsomorphic(edgeList1: [string, "↔" | "→" | "←", string][], edgeList2: [string, "↔" | "→" | "←", string][]) {
    const graph1 = buildGraph(edgeList1);
    const graph2 = buildGraph(edgeList2);
    const vertices1 = Object.keys(graph1);
    const vertices2 = Object.keys(graph2);

    // Quick check: graphs must have the same number of vertices
    if (vertices1.length !== vertices2.length) return false;

    // Quick check: compare sorted degree pairs [in-degree, out-degree]
    const degrees1 = vertices1
        .map(v => `${graph1[v].in.size},${graph1[v].out.size}`)
        .sort()
        .join(',');
    const degrees2 = vertices2
        .map(v => `${graph2[v].in.size},${graph2[v].out.size}`)
        .sort()
        .join(',');
    if (degrees1 !== degrees2) return false;

    const mapping = {} as Record<string, string>; // Mapping from graph1 vertices to graph2 vertices
    const used = new Set(); // Set of graph2 vertices that have been mapped

    // Checks the current partial mapping for consistency
    function isValidMapping() {
        for (const u of vertices1) {
            if (mapping[u]) {
                for (const v of graph1[u].out) {
                    if (mapping[v]) {
                        // Check that the mapped edge exists in graph2
                        if (!graph2[mapping[u]].out.has(mapping[v])) {
                            return false;
                        }
                    }
                }
            }
        }
        return true;
    }

    // Recursively tries to assign each vertex in graph1 to a vertex in graph2
    function backtrack(index: number) {
        if (index === vertices1.length) {
            // All vertices have been successfully mapped
            return true;
        }
        const u = vertices1[index];
        for (const v of vertices2) {
            if (!used.has(v)) {
                // Check if in-degree and out-degree match
                if (graph1[u].in.size === graph2[v].in.size &&
                    graph1[u].out.size === graph2[v].out.size) {
                    mapping[u] = v;
                    used.add(v);
                    if (isValidMapping() && backtrack(index + 1)) {
                        return true;
                    }
                    // Backtrack
                    delete mapping[u];
                    used.delete(v);
                }
            }
        }
        return false;
    }

    return backtrack(0);
}
