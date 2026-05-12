import { CandidateCtaSection } from "./components/home/CandidateCtaSection";
import { featuredJobs, quickFilters, topCompanies } from "./components/home/data";
import { FeaturedJobsSection } from "./components/home/FeaturedJobsSection";
import { HeroSection } from "./components/home/HeroSection";
import { HomeHeader } from "./components/home/HomeHeader";
import { HomeFooter } from "./components/home/HomeFooter";
import { TopCompaniesSection } from "./components/home/TopCompaniesSection";

// Trang chủ public (localhost:3000):
// compose từ các section home để dễ thay thế data mock bằng API thật sau này.
export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <HomeHeader />
      <main>
        <HeroSection quickFilters={quickFilters} />
        <TopCompaniesSection companies={topCompanies} />
        <FeaturedJobsSection jobs={featuredJobs} />
        <CandidateCtaSection />
      </main>
      <HomeFooter />
    </div>
  );
}
