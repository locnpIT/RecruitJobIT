import { StateCard } from "@/app/components/shared/StateCard";

type TopCompaniesStatesProps = {
  loading: boolean;
  empty: boolean;
};

// Tách các trạng thái loading/empty riêng để giảm if-else lồng trong section chính.
export function TopCompaniesStates({ loading, empty }: TopCompaniesStatesProps) {
  if (loading) {
    return <StateCard message="Đang tải danh sách doanh nghiệp..." tone="muted" />;
  }

  if (empty) {
    return <StateCard message="Chưa có doanh nghiệp nổi bật để hiển thị." tone="muted" />;
  }

  return null;
}
