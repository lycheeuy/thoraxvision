import { Activity, Calendar, FolderOpen, ShieldCheck, type LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export interface StatisticsCardsProps {
  statistics: {
    total_studies: number;
    today_studies: number;
    tb_detected: number;
    normal_detected: number;
  };
}

interface StatCard {
  key: keyof StatisticsCardsProps["statistics"];
  title: string;
  subtitle: string;
  icon: LucideIcon;
}

const CARDS: readonly StatCard[] = [
  {
    key: "total_studies",
    title: "Total Studies",
    subtitle: "Total studies performed",
    icon: FolderOpen,
  },
  {
    key: "today_studies",
    title: "Today's Studies",
    subtitle: "Captured today",
    icon: Calendar,
  },
  {
    key: "tb_detected",
    title: "TB Detected",
    subtitle: "Tuberculosis findings",
    icon: Activity,
  },
  {
    key: "normal_detected",
    title: "Normal Cases",
    subtitle: "Normal findings",
    icon: ShieldCheck,
  },
] as const;

export function StatisticsCards({ statistics }: StatisticsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {CARDS.map(({ key, title, subtitle, icon: Icon }) => (
        <Card key={key}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{title}</span>
              <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
            </div>
            <p className="numeric mt-3 font-mono text-3xl font-bold tracking-tight tabular-nums">
              {statistics[key].toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}