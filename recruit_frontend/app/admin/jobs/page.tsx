import { JobsAdminClient } from "./components/JobsAdminClient";

// Page chỉ compose; logic nằm trong JobsAdminClient + hooks.
export default function JobsAdminPage() {
  return <JobsAdminClient />;
}
