import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus, Trash2, Rows3, Columns3, Calculator,
} from "lucide-react";
import {
  type DevisSheet,
  type SheetRow,
  addCustomColumn,
  addRowAfter,
  computePhaseSpans,
  fmtDa,
  parseHt,
  removeColumn,
  removeRow,
  rowHt,
  ttcOf,
  updateColumnLabel,
  updateRow,
} from "@/lib/devis-sheet";

type Props = {
  sheet: DevisSheet;
  onChange: (sheet: DevisSheet) => void;
};

export function DevisSheetEditor({ sheet, onChange }: Props) {
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [newColLabel, setNewColLabel] = useState("Note");

  const spans = useMemo(() => computePhaseSpans(sheet.rows), [sheet.rows]);
  const customCols = sheet.columns.filter((c) => !c.locked);

  const setCell = (rowId: string, patch: Partial<SheetRow>) => {
    onChange(updateRow(sheet, rowId, patch));
  };

  const setExtra = (rowId: string, colId: string, value: string) => {
    const row = sheet.rows.find((r) => r.id === rowId);
    if (!row) return;
    onChange(updateRow(sheet, rowId, { extra: { ...row.extra, [colId]: value } }));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Calculator className="h-3.5 w-3.5" />
          Feuille préremplie (FOR 44) — modifiez les cases, ajoutez ou supprimez des lignes / colonnes.
          TTC = HT × 1,19.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onChange(addRowAfter(sheet, selectedRowId, "line"))}
          >
            <Rows3 className="h-3.5 w-3.5 mr-1" /> Ligne
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onChange(addRowAfter(sheet, selectedRowId, "section"))}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Section
          </Button>
          <div className="flex items-center gap-1">
            <Input
              className="h-8 w-28 text-xs"
              value={newColLabel}
              onChange={(e) => setNewColLabel(e.target.value)}
              placeholder="Nom colonne"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                onChange(addCustomColumn(sheet, newColLabel.trim() || "Colonne", "text"));
                setNewColLabel("Note");
              }}
            >
              <Columns3 className="h-3.5 w-3.5 mr-1" /> Colonne
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded border overflow-auto max-h-[50vh] bg-white shadow-sm">
        <table className="w-full text-xs border-collapse min-w-[640px]">
          <thead className="bg-slate-100 sticky top-0 z-10">
            <tr>
              {sheet.columns.map((col) => (
                <th
                  key={col.id}
                  className={
                    col.kind === "phase"
                      ? "text-left p-2 w-24 border-b"
                      : col.kind === "ht" || col.kind === "ttc"
                        ? "text-right p-2 w-36 border-b"
                        : "text-left p-2 border-b min-w-[140px]"
                  }
                >
                  <div className="flex items-center gap-1 justify-between">
                    {col.locked ? (
                      <span className="font-semibold">{col.label}</span>
                    ) : (
                      <>
                        <Input
                          className="h-7 text-xs font-semibold bg-transparent border-dashed"
                          value={col.label}
                          onChange={(e) => onChange(updateColumnLabel(sheet, col.id, e.target.value))}
                        />
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-destructive p-0.5"
                          title="Supprimer la colonne"
                          onClick={() => onChange(removeColumn(sheet, col.id))}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </div>
                </th>
              ))}
              <th className="w-10 border-b p-1" />
            </tr>
          </thead>
          <tbody>
            {sheet.rows.map((row) => {
              const span = spans.get(row.id);
              const ht = rowHt(row, sheet.rows);
              const isSub = row.kind === "subtotal";
              const isSec = row.kind === "section";
              const selected = selectedRowId === row.id;

              return (
                <tr
                  key={row.id}
                  className={[
                    "border-t",
                    isSub ? "bg-slate-50 font-semibold" : "",
                    isSec ? "bg-slate-50/80 italic" : "",
                    selected ? "ring-2 ring-inset ring-primary/40" : "",
                    "hover:bg-sky-50/40 cursor-pointer",
                  ].join(" ")}
                  onClick={() => setSelectedRowId(row.id)}
                >
                  {sheet.columns.map((col) => {
                    if (col.kind === "phase") {
                      if (span && !span.start) return null;
                      return (
                        <td
                          key={col.id}
                          className="p-1 align-middle text-center font-semibold"
                          rowSpan={span?.span || 1}
                        >
                          {isSec ? (
                            <span className="px-1">{row.phase}</span>
                          ) : (
                            <Input
                              className="h-8 text-center text-xs font-semibold"
                              value={row.phase}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => setCell(row.id, { phase: e.target.value })}
                              placeholder="—"
                            />
                          )}
                        </td>
                      );
                    }

                    if (col.kind === "label") {
                      if (isSec) {
                        return (
                          <td
                            key={col.id}
                            className="p-1"
                            colSpan={1 + customCols.length + 2}
                          >
                            <Input
                              className="h-8 text-xs italic bg-transparent"
                              value={row.label}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => setCell(row.id, { label: e.target.value })}
                            />
                          </td>
                        );
                      }
                      return (
                        <td key={col.id} className="p-1">
                          <Input
                            className={`h-8 text-xs ${isSub ? "font-semibold" : ""}`}
                            value={row.label}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setCell(row.id, { label: e.target.value })}
                          />
                        </td>
                      );
                    }

                    if (isSec) return null;

                    if (col.kind === "ht") {
                      if (isSub) {
                        return (
                          <td key={col.id} className="p-2 text-right tabular-nums">
                            {fmtDa(ht)}
                          </td>
                        );
                      }
                      return (
                        <td key={col.id} className="p-1">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            className="h-8 text-right"
                            value={row.ht}
                            placeholder="0.00"
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setCell(row.id, { ht: e.target.value })}
                          />
                        </td>
                      );
                    }

                    if (col.kind === "ttc") {
                      return (
                        <td key={col.id} className="p-2 text-right tabular-nums text-muted-foreground">
                          {ht > 0 || isSub ? fmtDa(ttcOf(ht)) : "—"}
                        </td>
                      );
                    }

                    // custom text / number
                    return (
                      <td key={col.id} className="p-1">
                        {isSub ? (
                          <span className="text-muted-foreground px-1">—</span>
                        ) : (
                          <Input
                            type={col.kind === "number" ? "number" : "text"}
                            className="h-8 text-xs"
                            value={row.extra[col.id] ?? ""}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setExtra(row.id, col.id, e.target.value)}
                          />
                        )}
                      </td>
                    );
                  })}
                  <td className="p-1 text-center">
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-destructive p-1"
                      title="Supprimer la ligne"
                      onClick={(e) => {
                        e.stopPropagation();
                        onChange(removeRow(sheet, row.id));
                        if (selectedRowId === row.id) setSelectedRowId(null);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedRowId && (
        <p className="text-[11px] text-muted-foreground">
          Ligne sélectionnée — « Ajouter une ligne » l’insère juste en dessous.
          {(() => {
            const r = sheet.rows.find((x) => x.id === selectedRowId);
            if (!r || r.kind !== "line") return null;
            return (
              <label className="ml-3 inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!r.countsTowardAmount}
                  onChange={(e) => setCell(r.id, { countsTowardAmount: e.target.checked })}
                />
                Compter dans le montant principal du devis
              </label>
            );
          })()}
        </p>
      )}

      <div className="flex justify-end text-xs font-medium tabular-nums text-slate-700">
        Total lignes principales HT :{" "}
        {fmtDa(
          sheet.rows
            .filter((r) => r.kind === "line" && r.countsTowardAmount)
            .reduce((s, r) => s + parseHt(r.ht), 0),
        )}{" "}
        DA
      </div>
    </div>
  );
}
