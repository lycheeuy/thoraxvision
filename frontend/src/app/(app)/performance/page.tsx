import { Activity } from "lucide-react";

import { PlaceholderPage } from "@/components/common/placeholder-page";

export default function PerformancePage() {
  return (
    <PlaceholderPage
      icon={Activity}
      title="Model Performance"
      description="Training metrics, confusion matrix, and ROC curve from the research reports."
      phase="Phase 8"
    />
  );
}