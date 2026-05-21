import AsyncStorage from '@react-native-async-storage/async-storage';

const LIVE_ANALYTICS_ENABLED_KEY = 'live_analytics_enabled';

export async function getLiveAnalyticsEnabled(): Promise<boolean> {
  const value = await AsyncStorage.getItem(LIVE_ANALYTICS_ENABLED_KEY);

  return value !== 'false';
}

export async function setLiveAnalyticsEnabled(enabled: boolean) {
  await AsyncStorage.setItem(
    LIVE_ANALYTICS_ENABLED_KEY,
    enabled ? 'true' : 'false'
  );
}
