import AsyncStorage from '@react-native-async-storage/async-storage';

const selectedLiveKey = (branchId: number, userId: number) =>
  `selected_live_${branchId}_${userId}`;

const operationalSoldKey = (branchId: number, userId: number, liveId: number) =>
  `live_operational_sold_${branchId}_${userId}_${liveId}`;

export async function saveSelectedLiveId(
  branchId: number,
  userId: number,
  liveId: number
) {
  await AsyncStorage.setItem(selectedLiveKey(branchId, userId), String(liveId));
}

export async function getSelectedLiveId(
  branchId: number,
  userId: number
): Promise<number | null> {
  const value = await AsyncStorage.getItem(selectedLiveKey(branchId, userId));
  const liveId = value ? Number(value) : null;

  return liveId && Number.isFinite(liveId) ? liveId : null;
}

export async function clearSelectedLiveId(branchId: number, userId: number) {
  await AsyncStorage.removeItem(selectedLiveKey(branchId, userId));
}

export async function getOperationalSoldReservationIds(
  branchId: number,
  userId: number,
  liveId: number
): Promise<number[]> {
  const raw = await AsyncStorage.getItem(operationalSoldKey(branchId, userId, liveId));

  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value) => Number.isFinite(Number(value))).map(Number)
      : [];
  } catch {
    return [];
  }
}

export async function saveOperationalSoldReservationIds(
  branchId: number,
  userId: number,
  liveId: number,
  reservationIds: number[]
) {
  const uniqueIds = Array.from(new Set(reservationIds));
  await AsyncStorage.setItem(
    operationalSoldKey(branchId, userId, liveId),
    JSON.stringify(uniqueIds)
  );
}
