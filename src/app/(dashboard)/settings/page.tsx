import { getSectionTypesGrouped } from "@/actions/section-types";
import { SectionLibrary } from "@/components/settings/section-library";

export default async function SettingsPage() {
  const grouped = await getSectionTypesGrouped();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage section types used for page component detection.
        </p>
      </div>

      <SectionLibrary grouped={grouped} />
    </div>
  );
}
