"use client";

import { useEffect, useState } from "react";
import { ChevronDown, MapPin, Search } from "lucide-react";
import { locationService, type Province } from "@/services/location.service";

type HeroSectionProps = {
  quickFilters: string[];
};

// Hero section của homepage.
// Đây là khối entry-point để người dùng hiểu value proposition và thực hiện tìm việc nhanh.

export function HeroSection({ quickFilters }: HeroSectionProps) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(true);
  const [provinceError, setProvinceError] = useState("");

  useEffect(() => {
    let isMounted = true;

    locationService
      .getProvinces()
      .then((data) => {
        if (!isMounted) {
          return;
        }

        setProvinces(data);
        setProvinceError("");
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setProvinceError("Không tải được tỉnh/thành");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingProvinces(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section
      className="border-b border-slate-200 bg-slate-100"
      style={{
        backgroundImage: "url('/bannerforhomepage.png')",
        backgroundSize: "cover",
        backgroundPosition: "center center",
      }}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:py-14">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Nền tảng tìm việc dành cho ứng viên
            </p>

            <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight tracking-[-0.03em] text-slate-950 md:text-5xl">
              Tìm công việc phù hợp với kỹ năng của bạn
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Tìm kiếm việc làm theo vị trí, kỹ năng, công ty hoặc địa điểm.
              Cập nhật hồ sơ để nhận gợi ý việc làm phù hợp hơn.
            </p>

            <div className="mt-7">
              <div className="grid overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:grid-cols-[1.45fr_1fr_auto]">
                <label className="flex h-16 items-center gap-3 px-4 md:px-5">
                  <Search className="h-6 w-6 shrink-0 text-slate-900" strokeWidth={2.1} />
                  <input
                    type="text"
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
                        : provinceError || "Tỉnh/thành phố"}
                    </option>
                    {provinces.map((province) => (
                      <option key={province.id} value={province.id}>
                        {province.ten}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 h-5 w-5 text-slate-900 md:right-5" />
                </label>

                <div className="border-t border-slate-200 p-2 md:border-l md:border-t-0">
                  <button
                    type="button"
                    className="h-12 w-full rounded-lg bg-slate-900 px-7 text-base font-semibold text-white transition hover:bg-slate-800 md:h-full md:min-w-36"
                  >
                    Tìm việc
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-sm text-slate-500">
                  Tìm kiếm nhanh:
                </span>

                {quickFilters.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            
          </div>
          </div>
      </div>
    </section>
  );
}
