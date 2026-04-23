import { CwvTestClient } from "@/components/cwv-test/cwv-test-client";

export default function CwvTestPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">CWV Test</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Paste website URLs to check whether each origin passes Core Web Vitals
          on mobile and desktop, based on Chrome real-user data.
        </p>
      </div>
      <CwvTestClient />
    </div>
  );
}
