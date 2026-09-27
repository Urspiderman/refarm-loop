"use client";

import dynamic from "next/dynamic";

const DemandLocationPicker = dynamic(
  () =>
    import(
      "@/components/partner/demand-location-picker"
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[360px] items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--bg)] md:h-[430px]">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[var(--green-800)] border-t-transparent" />

          <p className="text-sm font-semibold text-[var(--muted)]">
            Memuat peta...
          </p>
        </div>
      </div>
    ),
  }
);

export default function DemandLocationPickerWrapper() {
  return <DemandLocationPicker />;
}