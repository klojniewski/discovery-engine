"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  updateSectionType,
  createSectionType,
  deleteSectionType,
} from "@/actions/section-types";
import { Pencil, Trash2, Plus, X, Check, Loader2 } from "lucide-react";

interface SectionType {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string | null;
  svgContent: string | null;
  sortOrder: number;
}

interface SectionLibraryProps {
  grouped: Record<string, SectionType[]>;
}

export function SectionLibrary({ grouped }: SectionLibraryProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [isPending, startTransition] = useTransition();

  const categories = Object.keys(grouped);
  const totalCount = Object.values(grouped).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Section Library{" "}
          <span className="text-muted-foreground font-normal">
            ({totalCount} types)
          </span>
        </h2>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAdd(true)}
          disabled={showAdd}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Type
        </Button>
      </div>

      {showAdd && (
        <AddSectionForm
          categories={categories}
          onDone={() => setShowAdd(false)}
        />
      )}

      {categories.map((category) => (
        <div key={category} className="space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
            {category}{" "}
            <span className="text-xs">({grouped[category].length})</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {grouped[category].map((st) => (
              <SectionTypeCard
                key={st.id}
                sectionType={st}
                isEditing={editingId === st.id}
                onEdit={() => setEditingId(st.id)}
                onCancel={() => setEditingId(null)}
                isPending={isPending}
                startTransition={startTransition}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionTypeCard({
  sectionType,
  isEditing,
  onEdit,
  onCancel,
  isPending,
  startTransition,
}: {
  sectionType: SectionType;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  isPending: boolean;
  startTransition: (fn: () => void) => void;
}) {
  const [name, setName] = useState(sectionType.name);
  const [description, setDescription] = useState(
    sectionType.description ?? ""
  );

  function handleSave() {
    startTransition(async () => {
      await updateSectionType(sectionType.id, { name, description });
      onCancel();
    });
  }

  function handleDelete() {
    if (!confirm(`Delete "${sectionType.name}"?`)) return;
    startTransition(async () => {
      await deleteSectionType(sectionType.id);
      onCancel();
    });
  }

  if (isEditing) {
    return (
      <div className="rounded-lg border border-primary p-3 space-y-2">
        {sectionType.svgContent && (
          <div
            className="w-full rounded bg-muted/30"
            dangerouslySetInnerHTML={{ __html: sectionType.svgContent }}
          />
        )}
        <input
          className="w-full text-sm font-medium border rounded px-2 py-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="w-full text-xs border rounded px-2 py-1"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
        />
        <div className="flex items-center gap-1">
          <Button size="sm" variant="default" onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            <X className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto text-destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-3 space-y-2 group hover:border-primary/50 transition-colors">
      {sectionType.svgContent ? (
        <div
          className="w-full rounded bg-muted/30"
          dangerouslySetInnerHTML={{ __html: sectionType.svgContent }}
        />
      ) : (
        <div className="w-full h-20 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
          No SVG
        </div>
      )}
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{sectionType.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {sectionType.description}
          </p>
          <Badge variant="outline" className="text-[10px] mt-1">
            {sectionType.slug}
          </Badge>
        </div>
        <button
          onClick={onEdit}
          className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-foreground transition-opacity"
        >
          <Pencil className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function AddSectionForm({
  categories,
  onDone,
}: {
  categories: string[];
  onDone: () => void;
}) {
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState(categories[0] ?? "");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!slug || !name || !category) return;
    startTransition(async () => {
      await createSectionType({ slug, name, category, description });
      onDone();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border p-4 space-y-3 bg-muted/20"
    >
      <h4 className="font-medium text-sm">Add Section Type</h4>
      <div className="grid grid-cols-2 gap-3">
        <input
          className="text-sm border rounded px-2 py-1.5"
          placeholder="slug (e.g. hero-split)"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
        />
        <input
          className="text-sm border rounded px-2 py-1.5"
          placeholder="Display name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <select
          className="text-sm border rounded px-2 py-1.5"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          className="text-sm border rounded px-2 py-1.5"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Plus className="h-4 w-4 mr-1" />
          )}
          Add
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
