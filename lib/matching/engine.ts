export type SurplusInput = {
  id: string;
  supplier_id: string;
  material_name: string;
  quantity: number;
  condition: string;
};

export type AssessmentInput = {
  material_type: string | null;
  condition: string | null;
  recovery_potential: number | null;
  confidence: number | null;
};

export type DemandInput = {
  id: string;
  recovery_partner_id: string;
  material_name: string;
  pathway: string;
  quantity_needed: number;
  capacity_available_kg: number | null;
  min_condition: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type SupplierLocation = {
  latitude: number | null;
  longitude: number | null;
};

export type MatchResult = {
  demand_id: string;

  score: number;

  compatibility_score: number;
  quantity_score: number;
  distance_score: number;
  capacity_score: number;

  distance_km: number | null;
};

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function materialCompatibility(
  surplusMaterial: string,
  assessedMaterial: string | null,
  demandMaterial: string
) {
  const surplus = normalizeText(surplusMaterial);
  const assessed = normalizeText(assessedMaterial);
  const demand = normalizeText(demandMaterial);

  if (!demand) {
    return 0;
  }

  /*
   * Prioritas:
   * 1. hasil AI assessment
   * 2. nama material surplus
   */

  if (assessed && assessed === demand) {
    return 100;
  }

  if (surplus === demand) {
    return 100;
  }

  if (
    assessed &&
    (assessed.includes(demand) || demand.includes(assessed))
  ) {
    return 90;
  }

  if (
    surplus.includes(demand) ||
    demand.includes(surplus)
  ) {
    return 85;
  }

  /*
   * Pecah kata untuk mencari kemiripan sederhana.
   * AI nantinya dapat memperkaya bagian ini.
   */

  const sourceWords = new Set(
    `${surplus} ${assessed}`
      .split(/[\s,./()-]+/)
      .filter(Boolean)
  );

  const demandWords = demand
    .split(/[\s,./()-]+/)
    .filter(Boolean);

  if (demandWords.length === 0) {
    return 0;
  }

  const overlap = demandWords.filter((word) =>
    sourceWords.has(word)
  ).length;

  const ratio = overlap / demandWords.length;

  if (ratio >= 0.75) return 80;
  if (ratio >= 0.5) return 65;
  if (ratio > 0) return 40;

  return 0;
}

function quantityScore(
  surplusQuantity: number,
  demandQuantity: number
) {
  if (surplusQuantity <= 0 || demandQuantity <= 0) {
    return 0;
  }

  /*
   * Ideal jika surplus mampu memenuhi kebutuhan.
   */

  if (surplusQuantity >= demandQuantity) {
    return 100;
  }

  const ratio = surplusQuantity / demandQuantity;

  return Math.round(Math.min(100, ratio * 100));
}

function capacityScore(
  demandQuantity: number,
  capacityAvailable: number | null
) {
  if (
    capacityAvailable === null ||
    capacityAvailable === undefined
  ) {
    return 50;
  }

  if (capacityAvailable <= 0) {
    return 0;
  }

  if (capacityAvailable >= demandQuantity) {
    return 100;
  }

  const ratio = capacityAvailable / demandQuantity;

  return Math.round(Math.min(100, ratio * 100));
}

function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const earthRadiusKm = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c =
    2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

function distanceScore(
  supplierLocation: SupplierLocation,
  demand: DemandInput
) {
  if (
    supplierLocation.latitude === null ||
    supplierLocation.longitude === null ||
    demand.latitude === null ||
    demand.longitude === null
  ) {
    return {
      score: 50,
      distanceKm: null,
    };
  }

  const distanceKm = haversineDistanceKm(
    supplierLocation.latitude,
    supplierLocation.longitude,
    demand.latitude,
    demand.longitude
  );

  /*
   * <= 5 km     = 100
   * <= 10 km    = 90
   * <= 25 km    = 75
   * <= 50 km    = 60
   * <= 100 km   = 40
   * > 100 km    = 20
   */

  let score = 20;

  if (distanceKm <= 5) {
    score = 100;
  } else if (distanceKm <= 10) {
    score = 90;
  } else if (distanceKm <= 25) {
    score = 75;
  } else if (distanceKm <= 50) {
    score = 60;
  } else if (distanceKm <= 100) {
    score = 40;
  }

  return {
    score,
    distanceKm: Number(distanceKm.toFixed(2)),
  };
}

export function calculateMatchScore({
  surplus,
  assessment,
  demand,
  supplierLocation,
}: {
  surplus: SurplusInput;
  assessment: AssessmentInput | null;
  demand: DemandInput;
  supplierLocation: SupplierLocation;
}): MatchResult {
  const compatibility = materialCompatibility(
    surplus.material_name,
    assessment?.material_type ?? null,
    demand.material_name
  );

  const quantity = quantityScore(
    surplus.quantity,
    demand.quantity_needed
  );

  const capacity = capacityScore(
    demand.quantity_needed,
    demand.capacity_available_kg
  );

  const distance = distanceScore(
    supplierLocation,
    demand
  );

  /*
   * Bobot:
   *
   * Compatibility = 40%
   * Quantity      = 20%
   * Distance      = 20%
   * Capacity      = 20%
   */

  const totalScore =
    compatibility * 0.4 +
    quantity * 0.2 +
    distance.score * 0.2 +
    capacity * 0.2;

  return {
    demand_id: demand.id,

    score: Number(totalScore.toFixed(2)),

    compatibility_score: compatibility,
    quantity_score: quantity,
    distance_score: distance.score,
    capacity_score: capacity,

    distance_km: distance.distanceKm,
  };
}