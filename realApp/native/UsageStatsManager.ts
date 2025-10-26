import { NativeModules } from 'react-native';

const { UsageStatsModule } = NativeModules;


type UsageStatsType = {
  hasUsagePermission(): Promise<boolean>;
  openUsageAccessSettings(): void;
  queryUsage(startMillis: number, endMillis: number): Promise<Record<string, number>>;
};

// Optional runtime check
if (!UsageStatsModule) {
  console.warn('UsageStatsModule is not available. Are you running in Expo Go or missing a dev build?');
}

const safeModule = UsageStatsModule as UsageStatsType | null;

export const getUsageStats = (start: number, end: number) =>
  safeModule?.queryUsage(start, end) ?? Promise.resolve({});

export const requestUsageAccess = () =>
  safeModule?.openUsageAccessSettings?.();

export const hasUsagePermission = () =>
  safeModule?.hasUsagePermission?.() ?? Promise.resolve(false);

export default {
  hasUsagePermission,
  openUsageAccessSettings: requestUsageAccess,
  queryUsage: getUsageStats,
};
