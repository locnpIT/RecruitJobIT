import { CompanyDetailClient } from "./components/CompanyDetailClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PublicCompanyPage({ params }: PageProps) {
  const { id } = await params;
  return <CompanyDetailClient companyId={id} />;
}
