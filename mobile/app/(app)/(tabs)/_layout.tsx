import { useRef, useEffect } from 'react';
import { Tabs } from 'expo-router';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Colors } from '@/constants/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const SCREEN_WIDTH = Dimensions.get('window').width;
const TAB_COUNT    = 4;
const TAB_WIDTH    = SCREEN_WIDTH / TAB_COUNT;

// Görünür tab'ların sırası (state.routes içindeki isimlerle eşleşmeli)
const VISIBLE_TABS: {
  name: string; label: string;
  icon: IoniconName; iconFocused: IoniconName;
}[] = [
  { name: 'home',   label: 'Ana Sayfa',    icon: 'home-outline',    iconFocused: 'home'    },
  { name: 'map',    label: 'Harita',        icon: 'map-outline',     iconFocused: 'map'     },
  { name: 'report', label: 'Hasar Raporla', icon: 'warning-outline', iconFocused: 'warning' },
  { name: 'team',   label: 'Ekibim',        icon: 'people-outline',  iconFocused: 'people'  },
];

// ── Tek tab butonu ────────────────────────────────────────────────
function TabItem({
  label, icon, iconFocused, focused, onPress,
}: {
  label: string; icon: IoniconName; iconFocused: IoniconName;
  focused: boolean; onPress: () => void;
}) {
  const scale   = useRef(new Animated.Value(1)).current;
  const bgOp    = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const contentOp = useRef(new Animated.Value(focused ? 1 : 0.45)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: focused ? 1.1 : 1,
        useNativeDriver: true,
        damping: 14,
        stiffness: 240,
      }),
      Animated.timing(bgOp, {
        toValue: focused ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(contentOp, {
        toValue: focused ? 1 : 0.45,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 0.85,
        useNativeDriver: true,
        damping: 10,
        stiffness: 400,
      }),
      Animated.spring(scale, {
        toValue: focused ? 1.1 : 1,
        useNativeDriver: true,
        damping: 12,
        stiffness: 200,
      }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity style={styles.tabItem} onPress={handlePress} activeOpacity={1}>
      <Animated.View style={[styles.tabInner, { transform: [{ scale }] }]}>
        {/* Aktif arka plan */}
        <Animated.View style={[styles.activeGlow, { opacity: bgOp }]} />

        {/* Icon */}
        <Animated.View style={{ opacity: contentOp }}>
          <Ionicons
            name={focused ? iconFocused : icon}
            size={22}
            color={focused ? Colors.primary : Colors.textSecondary}
          />
        </Animated.View>

        {/* Label */}
        <Animated.Text
          style={[styles.tabLabel, {
            color: focused ? Colors.primary : Colors.textSecondary,
            opacity: contentOp,
            fontWeight: focused ? '700' : '400',
          }]}
          numberOfLines={1}
        >
          {label}
        </Animated.Text>

        {/* Alt nokta */}
        <Animated.View style={[styles.activeDot, { opacity: bgOp }]} />
      </Animated.View>
    </TouchableOpacity>
  );
}

// ── Özel animasyonlu tab bar ──────────────────────────────────────
function AnimatedTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  // Aktif tab'ın görünür indeksi (tasks/profile gizli route'ları atla)
  const activeRoute    = state.routes[state.index]?.name ?? ''
  const activeTabIndex = VISIBLE_TABS.findIndex(t => t.name === activeRoute)
  const safeIndex      = activeTabIndex >= 0 ? activeTabIndex : 0

  // İlk render'da doğru konuma başla
  const indicatorX = useRef(
    new Animated.Value(safeIndex * TAB_WIDTH + (TAB_WIDTH - 36) / 2)
  ).current;

  useEffect(() => {
    Animated.spring(indicatorX, {
      toValue: safeIndex * TAB_WIDTH + (TAB_WIDTH - 36) / 2,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
      mass: 0.8,
    }).start();
  }, [safeIndex]);

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom || 10 }]}>
      {/* Kayan aktif çizgi */}
      <View style={styles.indicatorTrack}>
        <Animated.View
          style={[styles.indicatorPill, { transform: [{ translateX: indicatorX }] }]}
        />
      </View>

      {/* Tab butonları */}
      <View style={styles.tabRow}>
        {VISIBLE_TABS.map((tab, index) => {
          const route   = state.routes.find(r => r.name === tab.name);
          const focused = activeTabIndex === index;

          return (
            <TabItem
              key={tab.name}
              label={tab.label}
              icon={tab.icon}
              iconFocused={tab.iconFocused}
              focused={focused}
              onPress={() => {
                if (!route) return;
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(tab.name);
                }
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

// ── Layout ────────────────────────────────────────────────────────
export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: '#0a1628' },
      }}
    >
      <Tabs.Screen name="home"    options={{ title: 'Ana Sayfa'    }} />
      <Tabs.Screen name="map"     options={{ title: 'Harita'        }} />
      <Tabs.Screen name="report"  options={{ title: 'Hasar Raporla' }} />
      <Tabs.Screen name="team"    options={{ title: 'Ekibim'        }} />
      <Tabs.Screen name="tasks"   options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}

// ── Stiller ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0e2137',
    borderTopWidth: 1,
    borderTopColor: 'rgba(6,182,212,0.12)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
      },
      android: { elevation: 16 },
    }),
  },

  indicatorTrack: {
    height: 2,
    backgroundColor: 'rgba(6,182,212,0.08)',
  },
  indicatorPill: {
    position: 'absolute',
    top: 0,
    width: 36,
    height: 2,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
  },

  tabRow: {
    flexDirection: 'row',
    paddingTop: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  activeGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14,
    backgroundColor: 'rgba(6,182,212,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(6,182,212,0.20)',
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    marginTop: 1,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
});
