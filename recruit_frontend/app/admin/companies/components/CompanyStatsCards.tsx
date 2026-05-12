type CompanyStatsCardsProps = {
  items: Array<{
    label: string;
    value: number;
  }>;
};

export function CompanyStatsCards({ items }: CompanyStatsCardsProps) {
  return (
    <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
      {items.map((item) => (
        <article key={item.label} className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">{item.label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{item.value}</p>
        </article>
      ))}
    </section>
  );
}
