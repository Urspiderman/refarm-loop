import SurplusForm from "@/components/surplus-form";

export default function NewSurplus() {
  return (
    <div className="px-5 py-8 md:px-8 md:py-10">
      <h1 className="text-3xl font-black">Tambah Surplus</h1>

      <p className="mt-1 text-sm text-[var(--muted)]">
        Daftarkan material surplus Anda dan biarkan ReFarm AI membantu
        melakukan assessment awal.
      </p>

      <div className="mt-6">
        <SurplusForm />
      </div>
    </div>
  );
}