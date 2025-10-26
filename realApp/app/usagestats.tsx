import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Button, TouchableOpacity, Linking, Platform } from 'react-native';
// Import your native module – adapt the import path/module name as needed
import UsageStatsManager from '../native/UsageStatsManager';

const ScreenTimeScreen = () => {
  const [appUsage, setAppUsage] = useState([]);
  const [loading, setLoading] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [error, setError] = useState(null);

  // Check permission status and request if not granted
  const checkPermission = useCallback(async () => {
    try {
      const hasPermission = await UsageStatsManager.checkForPermission();
      setPermissionGranted(hasPermission);
      return hasPermission;
    } catch (e) {
      setError(e.message);
      setPermissionGranted(false);
      return false;
    }
  }, []);

  // Request permission if not granted (opens settings)
  const requestPermission = async () => {
    try {
      await UsageStatsManager.showUsageAccessSettings();
    } catch (e) {
      setError(e.message);
    }
  };

  // Fetch the usage data asynchronously from the native module
  const fetchUsageData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Define the date range for the usage stats (e.g., past 24 hours)
      const end = Date.now();
      const start = end - 24 * 60 * 60 * 1000; // 24 hours ago
      const data = await UsageStatsManager.queryUsageStats('INTERVAL_DAILY', start, end);
      setAppUsage(data);
    } catch (e) {
      setError(e.message);
      setAppUsage([]);
    }
    setLoading(false);
  }, []);

  // Initial effect — check permission and fetch data if granted
  useEffect(() => {
    (async () => {
      const granted = await checkPermission();
      if (granted) {
        fetchUsageData();
      }
    })();
  }, [checkPermission, fetchUsageData]);

  // Handler for when user comes back from settings — try to refetch permission/data
  useEffect(() => {
    const handler = async () => {
      const granted = await checkPermission();
      if (granted) {
        fetchUsageData();
      }
    };
    const unsubscribe = Platform.OS === 'android'
      ? Linking.addEventListener('url', handler)
      : undefined;
    return () => unsubscribe?.remove();
  }, [checkPermission, fetchUsageData]);

  // UI rendering
  if (!permissionGranted) {
    // Show a prompt to require permission and direct user to settings
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Usage Access Required</Text>
        <Text style={styles.text}>
          This feature needs permission to access app usage stats. Please enable "Usage Access" for this app in your phone settings.
        </Text>
        <Button title="Grant Access" onPress={requestPermission} />
        {error && <Text style={styles.error}>{error}</Text>}
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Loading screen time data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
        <Button title="Try Again" onPress={fetchUsageData} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Per-App Screen Time (Today)</Text>
      <FlatList
        data={appUsage}
        keyExtractor={(item) => item.packageName}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.appName}>{item.appName || item.packageName}</Text>
            <Text style={styles.usageTime}>{formatMilliseconds(item.totalTimeInForeground)}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.text}>
            No app usage data found. Use more apps to see their screen time here.
          </Text>
        }
        refreshing={loading}
        onRefresh={fetchUsageData}
      />
      <TouchableOpacity style={styles.refreshBtn} onPress={fetchUsageData}>
        <Text style={styles.refreshText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );
};

// Helper for formatting ms to HH:MM:SS
function formatMilliseconds(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map(num => num.toString().padStart(2, '0')).join(':');
}

export default ScreenTimeScreen;

// Example styles – adjust to match your app theme!
const styles = StyleSheet.create({
  centered: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  text: { fontSize: 16, textAlign: 'center', marginBottom: 16 },
  error: { color: 'red', fontSize: 14, textAlign: 'center' },
  container: {
    flex: 1,
    backgroundColor: '#191a21',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    color: '#ffd33d',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: '#27293d',
    padding: 16,
    borderRadius: 10,
    marginVertical: 8,
    elevation: 2,
  },
  appName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  usageTime: { color: '#ffd33d', fontSize: 16, fontWeight: '700', marginTop: 4 },
  refreshBtn: {
    backgroundColor: '#ffd33d',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  refreshText: {
    color: '#191a21',
    fontWeight: 'bold',
    fontSize: 16,
  },
});