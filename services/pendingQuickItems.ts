import AsyncStorage from '@react-native-async-storage/async-storage';

export type QuickItemTarget = 'door-sale' | 'door-reservation' | 'live';

const keyForTarget = (target: QuickItemTarget) => `pending_quick_items_${target}`;

export async function appendPendingQuickItems(
  target: QuickItemTarget,
  itemIds: number[]
) {
  if (itemIds.length === 0) return;

  const key = keyForTarget(target);
  const current = await AsyncStorage.getItem(key);
  const parsed = current ? (JSON.parse(current) as number[]) : [];
  const next = Array.from(new Set([...parsed, ...itemIds]));

  await AsyncStorage.setItem(key, JSON.stringify(next));
}

export async function consumePendingQuickItems(target: QuickItemTarget) {
  const key = keyForTarget(target);
  const current = await AsyncStorage.getItem(key);

  if (!current) return [];

  await AsyncStorage.removeItem(key);
  return JSON.parse(current) as number[];
}
