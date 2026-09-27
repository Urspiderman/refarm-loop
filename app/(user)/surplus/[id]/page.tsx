import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Leaf, MapPin } from "lucide-react";
import MatchButton from "@/components/match-button";

export default async function Detail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const s = await createClient();

  const {
    data: { user },
  } = await s.auth.getUser();

  const { data: surplus } = await s
    .from("surplus_listings")
    .select("*, material_assessments(*)")
    .eq("id", id)
    .eq("supplier_id", user?.id || "")
    .single();

  if (!surplus) {
    notFound();
  }

  const assessment = surplus.material_assessments?.[0];

  let photoUrl = "";

  if (surplus.photo_path) {
    const signed = await s.storage
      .from("refarm-media")
      .createSignedUrl(surplus.photo_path, 3600);

    photoUrl = signed.data?.signedUrl || "";
  }

  return (
    <div className="px-5 py-8 md:px-8 md:py-10">
      {/* Back */}
      <Link
        href="/surplus"
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[var(--green-900)]"
      >
        <ArrowLeft size={17} />
        Surplus Saya
      </Link>

      <div className="card overflow-hidden">
        {/* Photo */}
        <div className="h-52 bg-[var(--mint)] md:h-72">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={surplus.material_name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Leaf
                size={58}
                className="text-[var(--green-800)]"
              />
            </div>
          )}
        </div>

        <div className="p-5 md:p-7">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black">
                {surplus.material_name}
              </h1>

              <p className="mt-1 text-sm text-[var(--muted)]">
                {surplus.quantity} {surplus.unit}
                {" • "}
                {surplus.category || "Material"}
              </p>
            </div>

            <span className="pill">
              {surplus.status}
            </span>
          </div>

          {/* AI Assessment */}
          {assessment && (
            <div className="mt-6 rounded-2xl bg-[var(--mint-2)] p-5">
              <p className="font-black text-[var(--green-900)]">
                Assessment ReFarm AI
              </p>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-[var(--muted)]">
                    Material
                  </p>
                  <p className="font-bold">
                    {assessment.material_type}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[var(--muted)]">
                    Kondisi
                  </p>
                  <p className="font-bold">
                    {assessment.condition}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[var(--muted)]">
                    Potensi Recovery
                  </p>
                  <p className="font-bold">
                    {assessment.recovery_potential}%
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[var(--muted)]">
                    Tingkat Keyakinan AI
                  </p>
                  <p className="font-bold">
                    {Math.round(
                      (assessment.confidence || 0) * 100
                    )}
                    %
                  </p>
                </div>
              </div>

              {/* Recommended Pathways */}
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold text-[var(--muted)]">
                  Rekomendasi Recovery
                </p>

                <div className="flex flex-wrap gap-2">
                  {(assessment.recommended_pathways || []).map(
                    (pathway: string) => (
                      <span className="pill" key={pathway}>
                        {pathway.replaceAll("_", " ")}
                      </span>
                    )
                  )}
                </div>
              </div>

              {/* Explanation */}
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                {assessment.explanation}
              </p>
            </div>
          )}

          {/* Matching */}
          <div className="mt-6">
            <MatchButton surplusId={surplus.id} />
          </div>

          {/* Detail */}
          <div className="mt-6 grid gap-4 text-sm">
            <div>
              <span className="text-[var(--muted)]">
                Kondisi
              </span>
              <p className="font-bold">
                {surplus.condition || "-"}
              </p>
            </div>

            <div>
              <span className="text-[var(--muted)]">
                Lokasi
              </span>

              <div className="mt-1 flex items-start gap-2">
                <MapPin
                  size={16}
                  className="mt-0.5 shrink-0 text-[var(--green-800)]"
                />

                <div>
                  <p className="font-bold">
                    {surplus.location_text || "-"}
                  </p>

                  {surplus.latitude != null &&
                    surplus.longitude != null && (
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        GPS:{" "}
                        {Number(surplus.latitude).toFixed(6)}
                        ,{" "}
                        {Number(surplus.longitude).toFixed(6)}
                      </p>
                    )}
                </div>
              </div>
            </div>

            <div>
              <span className="text-[var(--muted)]">
                Tanggal tersedia
              </span>

              <p className="font-bold">
                {surplus.available_date || "-"}
              </p>
            </div>

            <div>
              <span className="text-[var(--muted)]">
                Catatan
              </span>

              <p className="font-bold">
                {surplus.notes || "-"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}