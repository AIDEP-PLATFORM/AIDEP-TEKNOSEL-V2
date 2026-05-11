import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

interface SelectInputProps {
  label: string;
  options: string[];
  value: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  error?: string;
  labelSuffix?: string; // "(opsiyonel)" gibi
}

export function SelectInput({ label, options, value, onSelect, placeholder = 'Seçiniz', error, labelSuffix }: SelectInputProps) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = require('react').useState(false);

  return (
    <View style={styles.container}>
      {/* Label */}
      <Text style={styles.label}>
        {label}
        {labelSuffix ? <Text style={styles.labelSuffix}> {labelSuffix}</Text> : null}
      </Text>

      {/* Selector button */}
      <TouchableOpacity
        style={[styles.selector, error ? styles.selectorError : null]}
        onPress={() => setVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={[styles.selectorText, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={Colors.textSecondary} />
      </TouchableOpacity>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Modal */}
      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Başlık */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <TouchableOpacity onPress={() => setVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Seçenekler */}
          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            {options.map((option, index) => {
              const selected = value === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.option,
                    selected && styles.optionSelected,
                    index === options.length - 1 && styles.optionLast,
                  ]}
                  onPress={() => { onSelect(option); setVisible(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                    {option}
                  </Text>
                  {selected && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: 14, fontWeight: '500', color: Colors.text },
  labelSuffix: { fontSize: 12, color: Colors.textMuted, fontWeight: '400' },
  selector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: Colors.borderLight, borderRadius: 12,
    padding: 14, backgroundColor: 'rgba(15,23,42,0.8)',
  },
  selectorError: { borderColor: Colors.error },
  selectorText: { fontSize: FontSize.md, color: Colors.text },
  placeholder: { color: Colors.textSecondary },
  errorText: { fontSize: 12, color: Colors.error },

  // Modal
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: '#0e2137',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: Spacing.lg,
    maxHeight: '60%',
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center', marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sheetTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  option: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  optionLast: { borderBottomWidth: 0 },
  optionSelected: { },
  optionText: { fontSize: FontSize.md, color: Colors.textSecondary },
  optionTextSelected: { color: Colors.primary, fontWeight: '600' },
});
