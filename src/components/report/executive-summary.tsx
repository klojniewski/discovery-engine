import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  Layout,
  Puzzle,
  BarChart3,
  Globe,
  Clock,
} from "lucide-react";

interface ExecutiveSummaryProps {
  stats: {
    totalPages: number;
    scrapedPages: number;
    templateCount: number;
    componentCount: number;
    totalWords: number;
    avgWordsPerPage: number;
  };
  websiteUrl: string;
  analysisDate: string | null;
  notes?: string | null;
}

const STAT_CARDS = [
  {
    key: "totalPages" as const,
    label: "Pages Analyzed",
    icon: FileText,
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: "templateCount" as const,
    label: "Templates Found",
    icon: Layout,
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: "componentCount" as const,
    label: "Components",
    icon: Puzzle,
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: "totalWords" as const,
    label: "Total Words",
    icon: BarChart3,
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: "avgWordsPerPage" as const,
    label: "Avg Words/Page",
    icon: Globe,
    format: (v: number) => v.toLocaleString(),
  },
];

export function ExecutiveSummary({
  stats,
  websiteUrl,
  analysisDate,
  notes,
}: ExecutiveSummaryProps) {
  return (
    <section id="executive-summary">
      <h2 className="text-2xl font-bold mb-2">Executive Summary</h2>
      <p className="text-muted-foreground mb-6">
        Analysis of <strong>{websiteUrl}</strong>
        {analysisDate && (
          <>
            {" "}
            completed on{" "}
            <span className="font-medium">{analysisDate}</span>
          </>
        )}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.key}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-medium">{card.label}</span>
                </div>
                <p className="text-2xl font-bold tabular-nums">
                  {card.format(stats[card.key])}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {notes && (
        <div className="mt-6 rounded-lg border bg-amber-50/50 p-4 text-sm">
          <p className="font-medium text-amber-900 mb-1">Notes</p>
          <p className="text-amber-800 whitespace-pre-wrap">{notes}</p>
        </div>
      )}
    </section>
  );
}
