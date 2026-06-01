"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, MapPin, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useProvinces } from "@/app/hooks/useProvinces";

// Hero section của homepage.
// Đây là khối entry-point để người dùng hiểu value proposition và thực hiện tìm việc nhanh.

export function HeroSection() {
  const { provinces, isLoadingProvinces, provinceError } = useProvinces();
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [selectedProvinceId, setSelectedProvinceId] = useState("");

  // Submit từ Hero sẽ điều hướng sang /jobs với query params,
  // để trang /jobs gọi API search (Elasticsearch) theo bộ lọc tương ứng.
  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const query = new URLSearchParams();
    const trimmedKeyword = keyword.trim();
    if (trimmedKeyword.length > 0) {
      query.set("tuKhoa", trimmedKeyword);
    }

    if (selectedProvinceId) {
      const provinceName = provinces.find((item) => String(item.id) === selectedProvinceId)?.ten ?? "";
      if (provinceName) {
        query.set("diaDiem", provinceName);
      }
    }

    const nextUrl = query.toString().length > 0 ? `/jobs?${query.toString()}` : "/jobs";
    router.push(nextUrl);
  };

  // Search AI tái sử dụng keyword của Hero, nhưng chỉ gửi prompt sang `/jobs/ai`.
  // Địa điểm/filter không được đẩy qua luồng này để backend LangChain4j tự hiểu prompt.
  const handleAiSearch = () => {
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword) {
      return;
    }
    router.push(`/jobs/ai?prompt=${encodeURIComponent(trimmedKeyword)}`);
  };

  return (
    <section
      className="border-b border-slate-200 bg-slate-100"
      style={{
        backgroundImage: "url('/bannerforhomepage.png')",
        backgroundSize: "cover",
        backgroundPosition: "center center",
      }}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-20 md:py-28 lg:py-32">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Nền tảng tìm việc dành cho ứng viên
            </p>

            <h1 className="mt-3 max-w-2xl text-4xl font-bold leading-tight tracking-[-0.03em] text-slate-950 md:text-5xl">
              Tìm công việc phù hợp với kỹ năng của bạn
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Tìm kiếm việc làm theo vị trí, kỹ năng, công ty hoặc địa điểm.
              Cập nhật hồ sơ để nhận gợi ý việc làm phù hợp hơn.
            </p>

            <div className="mt-7">
              <div className="grid overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:grid-cols-[1.45fr_1fr_auto]">
                <form
                  onSubmit={handleSearch}
                  className="contents"
                >
                  <label className="flex h-16 items-center gap-3 px-4 md:px-5">
                    <Search className="h-6 w-6 shrink-0 text-slate-900" strokeWidth={2.1} />
                    <input
                      type="text"
                      value={keyword}
                      onChange={(event) => setKeyword(event.target.value)}
                      placeholder="Tên vị trí, kỹ năng hoặc công ty"
                      className="h-full min-w-0 flex-1 border-0 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </label>

                  <label className="relative flex h-16 items-center gap-3 border-t border-slate-200 px-4 md:border-l md:border-t-0 md:px-5">
                    <MapPin className="h-6 w-6 shrink-0 text-slate-900" strokeWidth={2.1} />
                    <select
                      value={selectedProvinceId}
                      onChange={(event) => setSelectedProvinceId(event.target.value)}
                      disabled={isLoadingProvinces || Boolean(provinceError)}
                      aria-label="Chọn tỉnh hoặc thành phố"
                      className="h-full min-w-0 flex-1 appearance-none border-0 bg-transparent pr-8 text-base font-medium text-slate-900 outline-none disabled:cursor-not-allowed disabled:text-slate-400"
                    >
                      <option value="">
                        {isLoadingProvinces
                          ? "Đang tải tỉnh/thành..."
                          : provinceError || "Tất cả tỉnh/thành"}
                      </option>
                      {provinces.map((province) => (
                        <option key={province.id} value={province.id}>
                          {province.ten}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 h-5 w-5 text-slate-900 md:right-5" />
                  </label>

                  <div className="flex flex-col gap-2 border-t border-slate-200 p-2 sm:flex-row md:border-l md:border-t-0">
                    <Button
                      type="submit"
                      variant="primary"
                      className="h-12 w-full gap-2 rounded-lg px-5 text-base font-semibold md:h-full md:min-w-32"
                    >
                      <Search className="h-4 w-4" />
                      Tìm việc
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleAiSearch}
                      disabled={!keyword.trim()}
                      className="h-12 w-full gap-2 rounded-lg px-5 text-base font-semibold md:h-full md:min-w-32"
                    >
                      <Sparkles className="h-4 w-4" />
                      Search AI
                    </Button>
                  </div>
                </form>
              </div>

            </div>

            
          </div>
          </div>
      </div>
    </section>
  );
}
