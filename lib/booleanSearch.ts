// lib/booleanSearch.ts
//
// Lightweight keyword + boolean search helper for ATS lists.
//
// Supports:
// - Free text:         senior backend lagos
// - Phrases:           "senior engineer" lagos
// - Field filters:     email:gmail.com stage:INTERVIEW status:REJECTED
// - Negation:          -contract -source:referral
// - OR:                senior OR principal
//
// Default operator between terms is AND.
// Expression is parsed as (clause1) OR (clause2) OR ...
// where each clause is an AND of its conditions.

export type BooleanSearchOptions = {
  haystack: string;
  fields?: Record<string, string | null | undefined>;
};

type Condition = {
  field: string | null;
  term: string;
  negated: boolean;
};

function tokenize(raw: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];

    if (ch === '"') {
      // Toggle quote mode
      if (inQuotes && current) {
        tokens.push(current);
        current = "";
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (/\s/.test(ch) && !inQuotes) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }

    current += ch;
  }

  if (current) {
    tokens.push(current);
  }

  return tokens;
}

function parseClauses(tokens: string[]): Condition[][] {
  const clauses: Condition[][] = [];
  let current: Condition[] = [];

  const pushCurrent = () => {
    if (current.length > 0) {
      clauses.push(current);
      current = [];
    }
  };

  for (const rawToken of tokens) {
    const upper = rawToken.toUpperCase();

    if (upper === "OR") {
      // Start a new OR clause
      pushCurrent();
      continue;
    }

    if (upper === "AND") {
      // AND is implicit inside a clause
      continue;
    }

    let token = rawToken;
    let negated = false;

    if (token.startsWith("-")) {
      negated = true;
      token = token.slice(1);
      if (!token) continue;
    }

    let field: string | null = null;
    let term = token;

    const colonIdx = token.indexOf(":");
    if (colonIdx > 0) {
      field = token.slice(0, colonIdx).toLowerCase();
      term = token.slice(colonIdx + 1);
    }

    term = term.trim();
    if (!term) continue;

    current.push({
      field,
      term: term.toLowerCase(),
      negated,
    });
  }

  pushCurrent();
  return clauses;
}

export function matchesBooleanQuery(
  rawQuery: string | null | undefined,
  { haystack, fields = {} }: BooleanSearchOptions,
): boolean {
  const q = (rawQuery || "").trim();
  if (!q) return true; // no query = match everything

  const haystackLower = haystack.toLowerCase();

  const fieldMap: Record<string, string> = {};
  for (const [key, value] of Object.entries(fields)) {
    fieldMap[key.toLowerCase()] = (value ?? "").toString().toLowerCase();
  }

  const tokens = tokenize(q);
  const clauses = parseClauses(tokens);
  if (clauses.length === 0) return true;

  const conditionMatches = (cond: Condition): boolean => {
    const term = cond.term;
    if (cond.field) {
      const fieldVal = fieldMap[cond.field] || "";
      const has = fieldVal.includes(term);
      return cond.negated ? !has : has;
    } else {
      const has = haystackLower.includes(term);
      return cond.negated ? !has : has;
    }
  };

  // Any clause (OR) where ALL conditions (AND) match
  return clauses.some((clause) => clause.every(conditionMatches));
}
