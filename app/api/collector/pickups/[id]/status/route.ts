import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type PickupStatus =
  | "scheduled"
  | "accepted"
  | "on_the_way"
  | "picked_up"
  | "delivered"
  | "cancelled";

const allowedTransitions: Record<
  PickupStatus,
  PickupStatus[]
> = {
  scheduled: ["accepted", "cancelled"],
  accepted: ["on_the_way", "cancelled"],
  on_the_way: ["picked_up", "cancelled"],
  picked_up: ["delivered"],
  delivered: [],
  cancelled: [],
};

const statusNotes: Record<PickupStatus, string> = {
  scheduled: "Pickup telah dijadwalkan.",
  accepted: "Collector menerima pickup.",
  on_the_way: "Collector sedang menuju lokasi pickup.",
  picked_up: "Barang telah diambil dari supplier.",
  delivered: "Barang telah sampai di lokasi tujuan.",
  cancelled: "Pickup dibatalkan.",
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // =========================================================
    // INIT
    // =========================================================

    const supabase = await createClient();

    // =========================================================
    // AUTH
    // =========================================================

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          message: "User belum login.",
        },
        { status: 401 }
      );
    }

    // =========================================================
    // PARAMETER
    // =========================================================

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Pickup ID tidak ditemukan.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // REQUEST BODY
    // =========================================================

    let body: {
      status?: PickupStatus;
      note?: string;
      latitude?: number | null;
      longitude?: number | null;
      actual_quantity?: number | null;
    } = {};

    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const newStatus = body.status;

    if (!newStatus) {
      return NextResponse.json(
        {
          success: false,
          message: "Status baru tidak ditemukan.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // VALID STATUS
    // =========================================================

    const validStatuses: PickupStatus[] = [
      "scheduled",
      "accepted",
      "on_the_way",
      "picked_up",
      "delivered",
      "cancelled",
    ];

    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: "Status pickup tidak valid.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // GET PICKUP
    // =========================================================

    const { data: pickup, error: pickupError } =
      await supabase
        .from("pickups")
        .select(`
          id,
          transaction_id,
          collector_id,
          status,
          scheduled_at,
          pickup_latitude,
          pickup_longitude,
          delivery_latitude,
          delivery_longitude,
          actual_quantity,
          pickup_proof_path,
          delivery_proof_path
        `)
        .eq("id", id)
        .eq("collector_id", user.id)
        .single();

    if (pickupError || !pickup) {
      console.error(
        "GET PICKUP ERROR:",
        pickupError
      );

      return NextResponse.json(
        {
          success: false,
          message: "Pickup tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    // =========================================================
    // CHECK CURRENT STATUS
    // =========================================================

    const currentStatus = pickup.status as PickupStatus;

    if (currentStatus === newStatus) {
      return NextResponse.json(
        {
          success: false,
          message: `Pickup sudah berstatus "${newStatus}".`,
        },
        { status: 400 }
      );
    }

    const nextStatuses =
      allowedTransitions[currentStatus] ?? [];

    if (!nextStatuses.includes(newStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: `Perubahan status dari "${currentStatus}" ke "${newStatus}" tidak diperbolehkan.`,
        },
        { status: 400 }
      );
    }

    // =========================================================
    // PREPARE UPDATE
    // =========================================================

    const updateData: {
      status: PickupStatus;
      actual_quantity?: number | null;
      pickup_latitude?: number | null;
      pickup_longitude?: number | null;
      delivery_latitude?: number | null;
      delivery_longitude?: number | null;
    } = {
      status: newStatus,
    };

    // Actual quantity dicatat ketika barang berhasil diambil.
    if (
      newStatus === "picked_up" &&
      body.actual_quantity !== undefined
    ) {
      updateData.actual_quantity =
        body.actual_quantity;
    }

    // Update koordinat pickup ketika collector
    // melakukan konfirmasi pickup.
    if (
      newStatus === "picked_up" &&
      body.latitude !== undefined
    ) {
      updateData.pickup_latitude =
        body.latitude;
    }

    if (
      newStatus === "picked_up" &&
      body.longitude !== undefined
    ) {
      updateData.pickup_longitude =
        body.longitude;
    }

    // Update koordinat delivery ketika barang sampai.
    if (
      newStatus === "delivered" &&
      body.latitude !== undefined
    ) {
      updateData.delivery_latitude =
        body.latitude;
    }

    if (
      newStatus === "delivered" &&
      body.longitude !== undefined
    ) {
      updateData.delivery_longitude =
        body.longitude;
    }

    // =========================================================
    // UPDATE PICKUP
    // =========================================================

    const { data: updatedPickup, error: updateError } =
      await supabase
        .from("pickups")
        .update(updateData)
        .eq("id", pickup.id)
        .eq("collector_id", user.id)
        .select(`
          id,
          transaction_id,
          collector_id,
          status,
          scheduled_at,
          pickup_latitude,
          pickup_longitude,
          delivery_latitude,
          delivery_longitude,
          actual_quantity,
          pickup_proof_path,
          delivery_proof_path,
          created_at,
          updated_at
        `)
        .single();

    if (updateError || !updatedPickup) {
      console.error(
        "UPDATE PICKUP ERROR:",
        updateError
      );

      return NextResponse.json(
        {
          success: false,
          message: "Gagal memperbarui status pickup.",
          error: updateError?.message,
        },
        { status: 500 }
      );
    }

    // =========================================================
    // CREATE PICKUP EVENT
    // =========================================================

    const eventNote =
      body.note?.trim() ||
      statusNotes[newStatus];

    const { data: event, error: eventError } =
      await supabase
        .from("pickup_events")
        .insert({
          pickup_id: pickup.id,
          status: newStatus,
          latitude:
            body.latitude ??
            (
              newStatus === "delivered"
                ? updatedPickup.delivery_latitude
                : updatedPickup.pickup_latitude
            ) ??
            null,
          longitude:
            body.longitude ??
            (
              newStatus === "delivered"
                ? updatedPickup.delivery_longitude
                : updatedPickup.pickup_longitude
            ) ??
            null,
          note: eventNote,
          proof_path: null,
        })
        .select(`
          id,
          pickup_id,
          status,
          latitude,
          longitude,
          note,
          proof_path,
          created_at
        `)
        .single();

    if (eventError) {
      console.error(
        "CREATE PICKUP EVENT ERROR:",
        eventError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Status pickup berhasil diperbarui, tetapi event gagal dicatat.",
          pickup: updatedPickup,
          error: eventError.message,
        },
        { status: 500 }
      );
    }

    // =========================================================
    // UPDATE TRANSACTION
    // =========================================================

    if (newStatus === "delivered") {
      const { error: transactionError } =
        await supabase
          .from("transactions")
          .update({
            status: "completed",
          })
          .eq("id", pickup.transaction_id)
          .eq("status", "in_collection");

      if (transactionError) {
        console.error(
          "UPDATE TRANSACTION ERROR:",
          transactionError
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "Pickup delivered, tetapi status transaction gagal diperbarui.",
            pickup: updatedPickup,
            event,
            error: transactionError.message,
          },
          { status: 500 }
        );
      }
    }

    // =========================================================
    // SUCCESS
    // =========================================================

    return NextResponse.json(
      {
        success: true,
        message: `Pickup berhasil diubah menjadi "${newStatus}".`,
        pickup: updatedPickup,
        event,
      },
      { status: 200 }
    );
  } catch (error) {
    // =========================================================
    // UNEXPECTED ERROR
    // =========================================================

    console.error(
      "UPDATE PICKUP STATUS UNEXPECTED ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}