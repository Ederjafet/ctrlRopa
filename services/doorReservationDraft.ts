import AsyncStorage from '@react-native-async-storage/async-storage';

export type DoorReservationDraftLine = {
  itemId: number;
  priceText: string;
};

export type DoorReservationDraft = {
  customerId?: number | null;
  paymentMethodId?: number | null;
  advanceText?: string;
  lines: DoorReservationDraftLine[];
};

const DRAFT_KEY = 'appmoda.doorReservation.draft';

export async function getDoorReservationDraft(): Promise<DoorReservationDraft | null> {
  const raw = await AsyncStorage.getItem(DRAFT_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as DoorReservationDraft;
    return {
      customerId: parsed.customerId ?? null,
      paymentMethodId: parsed.paymentMethodId ?? null,
      advanceText: parsed.advanceText ?? '',
      lines: Array.isArray(parsed.lines) ? parsed.lines : [],
    };
  } catch {
    await AsyncStorage.removeItem(DRAFT_KEY);
    return null;
  }
}

export async function saveDoorReservationDraft(draft: DoorReservationDraft) {
  await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export async function clearDoorReservationDraft() {
  await AsyncStorage.removeItem(DRAFT_KEY);
}
