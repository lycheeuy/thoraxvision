import { BrainCircuit } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export interface WelcomeHeroProps {
  fullName: string;
}

export function WelcomeHero({ fullName }: WelcomeHeroProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <Badge className="border-slate-200 bg-slate-50 text-slate-600">
            ThoraxVision Dashboard
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {fullName}
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            AI-assisted Tuberculosis Detection System for Chest X-ray Analysis.
          </p>
        </div>

        <div className="shrink-0">
          <span className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700">
            <BrainCircuit className="h-10 w-10" aria-hidden />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}