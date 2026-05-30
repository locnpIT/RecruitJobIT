import { Suspense } from "react";
import { JobsPageClient } from "./components/JobsPageClient";

export default function JobsPage() {
  return (
    <Suspense fallback={null}>
      <JobsPageClient />
    </Suspense>
  );
}
