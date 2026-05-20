import { JobDetailClient } from "./components/JobDetailClient";

type JobDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

// Page chỉ compose; state/client logic nằm trong JobDetailClient.
export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  return <JobDetailClient jobId={id} />;
}
