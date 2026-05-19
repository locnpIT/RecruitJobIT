import { JobDetailClient } from "./components/JobDetailClient";

type JobDetailPageProps = {
  params: {
    id: string;
  };
};

// Page chỉ compose; state/client logic nằm trong JobDetailClient.
export default function JobDetailPage({ params }: JobDetailPageProps) {
  return <JobDetailClient jobId={params.id} />;
}
