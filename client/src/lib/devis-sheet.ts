/** Modèle de feuille de devis guidée (FOR 44 / 44-1 / 44-2). */

export const TVA_RATE = 0.19;

export type SheetColumnKind = "phase" | "label" | "ht" | "ttc" | "text" | "number";

export type SheetColumn = {
  id: string;
  label: string;
  kind: SheetColumnKind;
  /** Colonnes du modèle officiel — non supprimables. */
  locked?: boolean;
};

export type SheetRowKind = "line" | "subtotal" | "section";

export type SheetRow = {
  id: string;
  kind: SheetRowKind;
  phase: string;
  label: string;
  /** Clé métier pour le breakdown (ex. registrationFee). */
  amountKey?: string;
  /** Montant HT saisi (lignes) — les sous-totaux sont calculés. */
  ht: string;
  /** Valeurs des colonnes personnalisées. */
  extra: Record<string, string>;
  /** Inclus dans le montant principal envoyé au backend. */
  countsTowardAmount?: boolean;
  /** Pour subtotal : ids des lignes à sommer. */
  sumRowIds?: string[];
};

export type DevisSheet = {
  columns: SheetColumn[];
  rows: SheetRow[];
};

let _seq = 0;
export function uid(prefix = "r") {
  _seq += 1;
  return `${prefix}_${Date.now().toString(36)}_${_seq}`;
}

export function fmtDa(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function parseHt(v: string | undefined | null): number {
  if (v == null || v === "") return 0;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function ttcOf(ht: number) {
  return ht * (1 + TVA_RATE);
}

const CORE_COLUMNS: SheetColumn[] = [
  { id: "phase", label: "Phases", kind: "phase", locked: true },
  { id: "label", label: "Désignation", kind: "label", locked: true },
  { id: "ht", label: "Montant HT (DA)", kind: "ht", locked: true },
  { id: "ttc", label: "Montant TTC (DA)", kind: "ttc", locked: true },
];

function line(
  phase: string,
  label: string,
  amountKey: string,
  opts?: { countsTowardAmount?: boolean },
): SheetRow {
  return {
    id: uid("line"),
    kind: "line",
    phase,
    label,
    amountKey,
    ht: "",
    extra: {},
    countsTowardAmount: opts?.countsTowardAmount ?? false,
  };
}

function subtotal(phase: string, label: string, sumRowIds: string[]): SheetRow {
  return {
    id: uid("sub"),
    kind: "subtotal",
    phase,
    label,
    ht: "",
    extra: {},
    sumRowIds,
  };
}

function section(phase: string, label: string): SheetRow {
  return {
    id: uid("sec"),
    kind: "section",
    phase,
    label,
    ht: "",
    extra: {},
  };
}

/** Gabarit INITIAL / RENOUVELLEMENT (FOR 44). */
export function buildInitialSheet(isInitial: boolean): DevisSheet {
  const rows: SheetRow[] = [];

  if (isInitial) {
    rows.push(line("Phase I", "Frais d'inscription du dossier (1)", "registrationFee", { countsTowardAmount: true }));
  }

  const p2a = line("Phase II", "Frais d'analyse documentaire", "analysisFeeP2", { countsTowardAmount: true });
  const p2e = line("Phase II", "Frais d'évaluation (2)", "evaluationFeeP2", { countsTowardAmount: true });
  rows.push(p2a, p2e, subtotal("Phase II", "S/Total frais d'Accréditation. Phase II", [p2a.id, p2e.id]));

  const p3 = line("Phase III", "Frais de délivrance du certificat et annexes", "certificateFeeP3", {
    countsTowardAmount: true,
  });
  rows.push(
    p3,
    subtotal("Phase III", "Total frais d'Accréditation. Phase II + Phase III", [p2a.id, p2e.id, p3.id]),
  );

  rows.push(line("Phase IV", "Redevance annuelle (Par année)", "annualFeeP4"));

  const p5a = line("Phase V", "Frais d'Analyse documentaire", "analysisFeeP5");
  const p5e = line("Phase V", "Frais d'évaluation (2)", "evaluationFeeP5");
  const p5c = line("Phase V", "Frais de modification du certificat et annexes (CAS) (3)", "casFeeP5");
  rows.push(
    section("Phase V", "Évaluation de surveillance (Par année)"),
    p5a,
    p5e,
    p5c,
    subtotal("Phase V", "Total Frais de Surveillance", [p5a.id, p5e.id, p5c.id]),
  );

  return { columns: [...CORE_COLUMNS], rows };
}

/** Gabarit SURVEILLANCE (FOR 44-1). */
export function buildSurveillanceSheet(): DevisSheet {
  const p1a = line("Phase I", "Frais Analyse documentaire", "analysisFeeP1", { countsTowardAmount: true });
  const p1e = line("Phase I", "Frais d'évaluation (1)", "evaluationFeeP1", { countsTowardAmount: true });
  const p2 = line("Phase II", "Frais de modification du certificat et annexes (CAS) (2)", "casFeeP2", {
    countsTowardAmount: true,
  });
  return {
    columns: [...CORE_COLUMNS],
    rows: [
      p1a,
      p1e,
      subtotal("Phase I", "S/TOTAL frais de surveillance", [p1a.id, p1e.id]),
      p2,
      subtotal("", "Total Frais de surveillance (Phase I + Phase II)", [p1a.id, p1e.id, p2.id]),
    ],
  };
}

/** Gabarit EXTENSION (FOR 44-2). */
export function buildExtensionSheet(): DevisSheet {
  const p1a = line("Phase I", "Frais analyse documentaire", "analysisFeeP1", { countsTowardAmount: true });
  const p1e = line("Phase I", "Frais d'évaluation (1)", "evaluationFeeP1", { countsTowardAmount: true });
  const p2 = line("Phase II", "Frais de modification du certificat ou annexes", "certModFeeP2", {
    countsTowardAmount: true,
  });
  const p3a = line("Phase III", "Redevance annuelle sur extension (par année) (2)", "annualExtensionFeeP3");
  const p3b = line("Phase III", "Prochaine redevance (INITIALE + EXTENSIONS)", "nextAnnualFeeP3");
  const p4a = line("Phase IV", "Frais Analyse documentaire", "analysisFeeP4");
  const p4e = line("Phase IV", "Frais d'évaluation (1)", "evaluationFeeP4");
  const p4c = line("Phase IV", "Frais de modification du certificat et annexes (CAS) (3)", "casFeeP4");

  return {
    columns: [...CORE_COLUMNS],
    rows: [
      p1a,
      p1e,
      subtotal("Phase I", "S/Total Frais d'extension (Phase I)", [p1a.id, p1e.id]),
      p2,
      subtotal("Phase II", "S/Total Frais d'extension (Phase II)", [p2.id]),
      p3a,
      p3b,
      section("Phase IV", "Prochaine Évaluation de surveillance (INITIALE + EXTENSIONS) (par année)"),
      p4a,
      p4e,
      p4c,
      subtotal("Phase IV", "Total Frais de surveillance", [p4a.id, p4e.id, p4c.id]),
    ],
  };
}

export function buildSheetForType(requestType: string): DevisSheet {
  const type = (requestType || "INITIAL").toUpperCase();
  if (type === "SURVEILLANCE") return buildSurveillanceSheet();
  if (type === "EXTENSION") return buildExtensionSheet();
  return buildInitialSheet(type === "INITIAL");
}

/** Montant HT d'une ligne (saisi ou sous-total calculé). */
export function rowHt(row: SheetRow, rows: SheetRow[]): number {
  if (row.kind === "subtotal") {
    const ids = new Set(row.sumRowIds || []);
    return rows
      .filter((r) => ids.has(r.id) && r.kind === "line")
      .reduce((s, r) => s + parseHt(r.ht), 0);
  }
  if (row.kind === "line") return parseHt(row.ht);
  return 0;
}

/** Map breakdown pour le backend (clés métier + clés custom_*). */
export function sheetToBreakdown(sheet: DevisSheet): Record<string, number> {
  const out: Record<string, number> = {};
  for (const row of sheet.rows) {
    if (row.kind !== "line") continue;
    const ht = parseHt(row.ht);
    if (ht <= 0) continue;
    const key = row.amountKey || row.id;
    out[key] = ht;
  }
  return out;
}

/** Montant principal (somme des lignes marquées countsTowardAmount). */
export function sheetMainTotal(sheet: DevisSheet): number {
  return sheet.rows
    .filter((r) => r.kind === "line" && r.countsTowardAmount)
    .reduce((s, r) => s + parseHt(r.ht), 0);
}

/** Calcul des rowSpan phase pour le rendu. */
export function computePhaseSpans(rows: SheetRow[]): Map<string, { start: boolean; span: number }> {
  const map = new Map<string, { start: boolean; span: number }>();
  let i = 0;
  while (i < rows.length) {
    const phase = rows[i].phase?.trim() || "";
    if (!phase) {
      // Ligne sans phase (ex. total général) : une cellule vide, pas de fusion
      map.set(rows[i].id, { start: true, span: 1 });
      i += 1;
      continue;
    }
    let j = i + 1;
    while (j < rows.length && (rows[j].phase?.trim() || "") === phase) j += 1;
    const span = j - i;
    for (let k = i; k < j; k++) {
      map.set(rows[k].id, { start: k === i, span: k === i ? span : 0 });
    }
    i = j;
  }
  return map;
}

export function addCustomColumn(sheet: DevisSheet, label: string, kind: "text" | "number" = "text"): DevisSheet {
  const id = uid("col");
  const col: SheetColumn = { id, label: label || "Colonne", kind };
  // Insérer avant HT
  const htIdx = sheet.columns.findIndex((c) => c.kind === "ht");
  const columns = [...sheet.columns];
  columns.splice(htIdx >= 0 ? htIdx : columns.length, 0, col);
  return { ...sheet, columns };
}

export function removeColumn(sheet: DevisSheet, columnId: string): DevisSheet {
  const col = sheet.columns.find((c) => c.id === columnId);
  if (!col || col.locked) return sheet;
  return {
    columns: sheet.columns.filter((c) => c.id !== columnId),
    rows: sheet.rows.map((r) => {
      const { [columnId]: _, ...extra } = r.extra;
      return { ...r, extra };
    }),
  };
}

export function addRowAfter(sheet: DevisSheet, afterRowId: string | null, kind: SheetRowKind = "line"): DevisSheet {
  const afterIdx = afterRowId ? sheet.rows.findIndex((r) => r.id === afterRowId) : sheet.rows.length - 1;
  const ref = afterIdx >= 0 ? sheet.rows[afterIdx] : undefined;
  const newRow: SheetRow = {
    id: uid(kind === "line" ? "line" : kind === "subtotal" ? "sub" : "sec"),
    kind,
    phase: ref?.phase || "",
    label: kind === "line" ? "Nouvelle ligne" : kind === "subtotal" ? "Sous-total" : "Section",
    amountKey: kind === "line" ? `custom_${uid("k")}` : undefined,
    ht: "",
    extra: {},
    countsTowardAmount: kind === "line" ? true : undefined,
    sumRowIds: kind === "subtotal" ? [] : undefined,
  };

  const rows = [...sheet.rows];
  const insertAt = afterIdx >= 0 ? afterIdx + 1 : rows.length;
  rows.splice(insertAt, 0, newRow);

  // Si on ajoute une ligne juste avant un sous-total de la même phase, l'inclure dans la somme
  if (kind === "line") {
    for (let i = insertAt + 1; i < rows.length; i++) {
      const r = rows[i];
      if (r.kind === "subtotal" && r.phase === newRow.phase) {
        rows[i] = { ...r, sumRowIds: [...(r.sumRowIds || []), newRow.id] };
        break;
      }
      if (r.kind !== "line" && r.kind !== "section") break;
      if (r.phase !== newRow.phase) break;
    }
  }

  return { ...sheet, rows };
}

export function removeRow(sheet: DevisSheet, rowId: string): DevisSheet {
  const rows = sheet.rows
    .filter((r) => r.id !== rowId)
    .map((r) =>
      r.kind === "subtotal" && r.sumRowIds
        ? { ...r, sumRowIds: r.sumRowIds.filter((id) => id !== rowId) }
        : r,
    );
  return { ...sheet, rows };
}

export function updateRow(sheet: DevisSheet, rowId: string, patch: Partial<SheetRow>): DevisSheet {
  return {
    ...sheet,
    rows: sheet.rows.map((r) => (r.id === rowId ? { ...r, ...patch, extra: patch.extra ?? r.extra } : r)),
  };
}

export function updateColumnLabel(sheet: DevisSheet, columnId: string, label: string): DevisSheet {
  return {
    ...sheet,
    columns: sheet.columns.map((c) => (c.id === columnId ? { ...c, label } : c)),
  };
}

/** Payload JSON persisté dans devisBreakdownJson. */
export function serializeDevisPayload(sheet: DevisSheet) {
  return {
    amounts: sheetToBreakdown(sheet),
    sheet,
  };
}
