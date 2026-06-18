import AsyncStorage from '@react-native-async-storage/async-storage';

const LIVE_LAYOUT_PREFS_KEY = 'live_layout_preferences';

export type LiveLayoutPreferences = {
  showRoles: boolean;
  showAnalytics: boolean;
  showActivityFeed: boolean;
  showPresenterView: boolean;
  showOperationalState: boolean;
  showProductSpotlight: boolean;
};

export const DEFAULT_LIVE_LAYOUT_PREFERENCES: LiveLayoutPreferences = {
  showRoles: true,
  showAnalytics: true,
  showActivityFeed: true,
  showPresenterView: true,
  showOperationalState: true,
  showProductSpotlight: true,
};

function getPreferenceKey(userId?: number | null) {
  return userId ? `${LIVE_LAYOUT_PREFS_KEY}:user:${userId}` : `${LIVE_LAYOUT_PREFS_KEY}:device`;
}

function normalizePreferences(value: Partial<LiveLayoutPreferences> | null) {
  return {
    ...DEFAULT_LIVE_LAYOUT_PREFERENCES,
    ...(value ?? {}),
  };
}

export async function getLiveLayoutPreferences(
  userId?: number | null
): Promise<LiveLayoutPreferences> {
  const userKey = getPreferenceKey(userId);
  const raw = await AsyncStorage.getItem(userKey);

  if (raw) {
    return normalizePreferences(JSON.parse(raw));
  }

  if (userId) {
    const deviceRaw = await AsyncStorage.getItem(getPreferenceKey());

    if (deviceRaw) {
      return normalizePreferences(JSON.parse(deviceRaw));
    }
  }

  return DEFAULT_LIVE_LAYOUT_PREFERENCES;
}

export async function saveLiveLayoutPreferences(
  preferences: LiveLayoutPreferences,
  userId?: number | null
) {
  await AsyncStorage.setItem(
    getPreferenceKey(userId),
    JSON.stringify(normalizePreferences(preferences))
  );
}

export async function setLiveLayoutPreference(
  key: keyof LiveLayoutPreferences,
  enabled: boolean,
  userId?: number | null
) {
  const current = await getLiveLayoutPreferences(userId);
  const next = {
    ...current,
    [key]: enabled,
  };

  await saveLiveLayoutPreferences(next, userId);

  return next;
}
