import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for the dashboard overview. Mirrors the final layout so
 * the transition to real content doesn't shift: welcome hero, four stat
 * cards, a recent-studies list, and a right rail (model, system, actions).
 */
export function DashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-8 px-6 py-8">
      {/* 1. Welcome hero */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          <Skeleton className="h-10 w-40" />
        </CardContent>
      </Card>

      {/* 2. Statistics cards — lg:4 / md:2 / sm:1 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="space-y-3 p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main split: recent studies (left) + right rail */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 3. Recent studies — large card, ~5 rows */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <Skeleton className="mb-5 h-5 w-40" />
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 4. Right panel — model / system / quick actions */}
        <div className="space-y-6">
          {/* Model status */}
          <Card>
            <CardContent className="space-y-4 p-6">
              <Skeleton className="h-5 w-32" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* System status */}
          <Card>
            <CardContent className="space-y-4 p-6">
              <Skeleton className="h-5 w-32" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardContent className="space-y-3 p-6">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}