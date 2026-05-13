import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize } from '@/constants/theme';

export default function TeamScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Ekibim</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  text: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700' },
});
