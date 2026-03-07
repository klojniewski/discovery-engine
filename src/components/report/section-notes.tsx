"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Save, X, Loader2 } from "lucide-react";
import { saveNotes } from "@/actions/report";

interface SectionNotesProps {
  sectionId: string;
  initialNotes: string | null;
}

export function SectionNotes({ sectionId, initialNotes }: SectionNotesProps) {
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saved, setSaved] = useState(initialNotes ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await saveNotes(sectionId, notes);
      setSaved(notes);
      setEditing(false);
    });
  }

  if (!editing && !saved) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Pencil className="h-3 w-3" />
        Add notes
      </button>
    );
  }

  if (!editing) {
    return (
      <div className="mt-4 rounded-lg border bg-amber-50/50 p-4 text-sm group relative">
        <p className="font-medium text-amber-900 mb-1">Notes</p>
        <p className="text-amber-800 whitespace-pre-wrap">{saved}</p>
        <button
          onClick={() => setEditing(true)}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-amber-600 hover:text-amber-800"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add notes for this section..."
        rows={3}
        className="text-sm"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5 mr-1" />
          )}
          Save
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setNotes(saved);
            setEditing(false);
          }}
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
