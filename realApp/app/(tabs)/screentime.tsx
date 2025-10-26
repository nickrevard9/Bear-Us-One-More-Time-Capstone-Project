import React, { useEffect, useState } from 'react';
import { View, Text, Button, ScrollView } from 'react-native';
import UsageStatsManager from '../../native/UsageStatsManager'; // adjust path as needed

const ScreenTimeTab: React.FC = () => {
  const [usageData, setUsageData] = useState<{ pkg: string; ms: number }[]>([]);

  useEffect(() => {
    const fetchUsage = async () => {
      const hasPermission = await UsageStatsManager.hasUsagePermission();
      if (!hasPermission) {
        UsageStatsManager.openUsageAccessSettings();
        return;
      }
      const end = Date.now();
      const start = end - 24 * 60 * 60 * 1000;
      const raw = await UsageStatsManager.queryUsage(start, end);
      const sorted = Object.entries(raw)
        .map(([pkg, ms]) => ({ pkg, ms }))
        .sort((a, b) => b.ms - a.ms)
        .slice(0, 10);
      setUsageData(sorted);
    };
    fetchUsage();
  }, []);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Screen Time</Text>
      <ScrollView style={{ marginTop: 12 }}>
        {usageData.map(({ pkg, ms }) => (
          <View key={pkg} style={{ marginBottom: 12 }}>
            <Text style={{ fontWeight: 'bold' }}>{pkg}</Text>
            <Text>{Math.floor(ms / 1000)} seconds</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default ScreenTimeTab;