import { FileText } from "lucide-react";

import { JsonView } from "@/components/insights/json-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface ResearchSummaryProps {
  data: Record<string, unknown> | null;
}

export function ResearchSummary({ data }: ResearchSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold tracking-tight">Research Summary</CardTitle>
      </CardHeader>
      <CardContent>
        {data ? (
          <JsonView data={data} />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground/60">
            <FileText className="h-8 w-8" aria-hidden />
            <span className="text-sm text-muted-foreground">No research summary available.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}