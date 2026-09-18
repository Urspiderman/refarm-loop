"use client";

import dynamic from "next/dynamic";

const RecoveryMap = dynamic(() => import("./recovery-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[320px] items-center justify-center rounded-[22px] bg-[#eaf4d7]">
      <div className="text-sm font-medium text-[#527d35]">
        Memuat recovery map...
      </div>
    </div>
  ),
});

export default RecoveryMap;