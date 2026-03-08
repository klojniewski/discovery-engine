"use server";

import { db } from "@/db";
import { sectionTypes } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getSectionTypes() {
  return db
    .select()
    .from(sectionTypes)
    .orderBy(asc(sectionTypes.sortOrder));
}

export async function getSectionTypesGrouped() {
  const all = await getSectionTypes();
  const grouped = new Map<string, typeof all>();
  for (const st of all) {
    const group = grouped.get(st.category) ?? [];
    group.push(st);
    grouped.set(st.category, group);
  }
  return Object.fromEntries(grouped);
}

export async function updateSectionType(
  id: string,
  data: {
    name?: string;
    category?: string;
    description?: string | null;
    svgContent?: string | null;
    slug?: string;
  }
) {
  await db
    .update(sectionTypes)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(sectionTypes.id, id));

  revalidatePath("/settings");
}

export async function createSectionType(data: {
  slug: string;
  name: string;
  category: string;
  description?: string | null;
  svgContent?: string | null;
}) {
  const maxOrder = await db
    .select({ sortOrder: sectionTypes.sortOrder })
    .from(sectionTypes)
    .orderBy(asc(sectionTypes.sortOrder))
    .limit(1);

  const [created] = await db
    .insert(sectionTypes)
    .values({
      ...data,
      sortOrder: (maxOrder[0]?.sortOrder ?? 0) + 1,
    })
    .returning();

  revalidatePath("/settings");
  return created;
}

export async function deleteSectionType(id: string) {
  await db.delete(sectionTypes).where(eq(sectionTypes.id, id));
  revalidatePath("/settings");
}
