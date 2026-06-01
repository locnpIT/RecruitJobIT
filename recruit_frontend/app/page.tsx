import { CandidateCtaSection } from "./components/home/CandidateCtaSection";
import { FeaturedJobsSection } from "./components/home/FeaturedJobsSection";
import { HeroSection } from "./components/home/HeroSection";
import { HomeHeader } from "./components/home/HomeHeader";
import { HomeFooter } from "./components/home/HomeFooter";
import { RecommendedJobsSection } from "./components/home/RecommendedJobsSection";
import { TopCompaniesSection } from "./components/home/TopCompaniesSection";

// Trang chủ public (localhost:3000):
// compose từ các section home đang nạp dữ liệu thật qua API service.
export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <HomeHeader />
      <main>
        <HeroSection />
        <TopCompaniesSection />
        <FeaturedJobsSection />
        <RecommendedJobsSection />
        <CandidateCtaSection />
      </main>
      <HomeFooter />
    </div>
  );
}
