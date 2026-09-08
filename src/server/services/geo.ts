// Haversine formula to compute great-circle distance between two GPS coordinates in Kilometers
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // 1 decimal place e.g. 4.2 km
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export interface BranchDeliveryConfig {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  deliveryMode: 'radius' | 'zone';
  maxDeliveryRadiusKm: number;
  baseDeliveryFee: number;
  baseDeliveryDistanceKm: number;
  extraFeePerKm: number;
  tiers?: Array<{ minKm: number; maxKm: number; fee: number }>;
  zones?: Array<{ id: string; zoneName: string; fee: number }>;
}

export interface DeliveryCalculationResult {
  covered: boolean;
  branchId?: string;
  branchName?: string;
  distanceKm?: number;
  deliveryFee: number;
  message?: string;
}

// Calculate distance & delivery fee for a customer location
export function evaluateBranchDelivery(
  branch: BranchDeliveryConfig,
  customerLat: number,
  customerLng: number
): DeliveryCalculationResult {
  const distanceKm = calculateHaversineDistanceKm(
    branch.latitude,
    branch.longitude,
    customerLat,
    customerLng
  );

  // 1. Distance Tier Brackets (e.g. 0-5 km: 20 EGP, 5-10 km: 35 EGP, 10-20 km: 50 EGP, 20-30 km: 75 EGP)
  if (branch.tiers && branch.tiers.length > 0) {
    const sortedTiers = [...branch.tiers].sort((a, b) => a.minKm - b.minKm);
    const maxTierKm = Math.max(...sortedTiers.map((t) => t.maxKm));

    if (distanceKm > maxTierKm) {
      return {
        covered: false,
        branchId: branch.id,
        branchName: branch.name,
        distanceKm,
        deliveryFee: 0,
        message: `Your location is ${distanceKm} km away. Maximum delivery range for ${branch.name} is ${maxTierKm} km.`,
      };
    }

    const matchedTier =
      sortedTiers.find((t) => distanceKm >= t.minKm && distanceKm <= t.maxKm) ||
      sortedTiers.find((t) => distanceKm <= t.maxKm) ||
      sortedTiers[sortedTiers.length - 1];

    return {
      covered: true,
      branchId: branch.id,
      branchName: branch.name,
      distanceKm,
      deliveryFee: matchedTier.fee,
    };
  }

  // 2. Fallback if no tiers: check max delivery radius & flat fee
  const maxRadius = branch.maxDeliveryRadiusKm || 30;
  if (distanceKm > maxRadius) {
    return {
      covered: false,
      branchId: branch.id,
      branchName: branch.name,
      distanceKm,
      deliveryFee: 0,
      message: `Your location is ${distanceKm} km away. Maximum delivery range for ${branch.name} is ${maxRadius} km.`,
    };
  }

  return {
    covered: true,
    branchId: branch.id,
    branchName: branch.name,
    distanceKm,
    deliveryFee: branch.baseDeliveryFee || 20,
  };
}

