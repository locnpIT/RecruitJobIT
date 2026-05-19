import { CompanyAdminJobsClient } from "./components/CompanyAdminJobsClient";

// Page chỉ compose; logic client nằm ở CompanyAdminJobsClient + hooks.
export default function CompanyAdminJobsPage() {
  return <CompanyAdminJobsClient />;
}
