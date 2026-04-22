import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { initObservability } from './src/observability';

initObservability();

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Glaon</Text>
      <Text>Secure Home Assistant frontend — bootstrap.</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 8,
  },
});
