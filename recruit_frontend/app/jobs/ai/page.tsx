import { Suspense } from "react";
import { AiJobsPageClient } from "./components/AiJobsPageClient";

export default function AiJobsPage() {
  return (
    <Suspense fallback={null}>
      <AiJobsPageClient />
    </Suspense>
  );
}
