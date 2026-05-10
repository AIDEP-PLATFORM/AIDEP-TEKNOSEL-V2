import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, Spacing } from '@/constants/theme';

export default function ReportScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hasar Raporla</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
  },
});
