import { BrainCircuit, Database, HardDrive, Server, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SystemStatusCardProps {
  system: {
    backend: boolean;
    database: boolean;
    ai_model: boolean;
    storage: boolean;
  };
}

interface StatusRow {
  key: keyof SystemStatusCardProps["system"];
  label: string;
  icon: LucideIcon;
}

const ROWS: readonly StatusRow[] = [
  { key: "backend", label: "Backend", icon: Server },
  { key: "database", label: "Database", icon: Database },
  { key: "ai_model", label: "AI Model", icon: BrainCircuit },
  { key: "storage", label: "Storage", icon: HardDrive },
] as const;

export function SystemStatusCard({ system }: SystemStatusCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold tracking-tight">System Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {ROWS.map(({ key, label, icon: Icon }) => {
          const online = system[key];
          return (
            <div
              key={key}
              className="flex items-center justify-between border-b border-border/40 py-2.5 last:border-0"
            >
              <div className="flex items-center gap-2.5">
                <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                <span className="text-sm font-medium">{label}</span>
              </div>
              <Badge
                className={cn(
                  "gap-1.5",
                  online
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-rose-200 bg-rose-50 text-rose-700",
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    online ? "bg-emerald-500" : "bg-rose-500",
                  )}
                  aria-hidden
                />
                {online ? "Online" : "Offline"}
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}