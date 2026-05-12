import type { ThongKeNhanhItem } from "../types";
import { StatCard } from "./StatCard";

// Grid bọc các stat card trên dashboard admin.
// Tách riêng để thay đổi layout responsive mà không đụng vào từng stat card.
type StatsGridProps = {
  items: ThongKeNhanhItem[];
};

export function StatsGrid({ items }: StatsGridProps) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <StatCard key={item.label} label={item.label} value={item.value} description={item.description} />
      ))}
    </section>
  );
}
