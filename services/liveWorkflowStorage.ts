import AsyncStorage from '@react-native-async-storage/async-storage';

const selectedLiveKey = (branchId: number, userId: number) =>
  `selected_live_${branchId}_${userId}`;

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
