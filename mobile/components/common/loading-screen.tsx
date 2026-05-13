import { View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';

export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo + Yazı yan yana */}
        <View style={styles.row}>
          <Image
            source={require('../../assets/images/aideplogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.textBlock}>
            <Text style={styles.title}>AIDEP</Text>
            <Text style={styles.subtitle}>YAPAY ZEKÂ DESTEKLİ{'\n'}DEPREM PLATFORMU</Text>
          </View>
        </View>
      </View>

      {/* Alt spinner */}
      <ActivityIndicator size="small" color="rgba(6,182,212,0.6)" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a1628',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logo: {
    width: 90,
    height: 90,
  },
  textBlock: {
    justifyContent: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 4,
    lineHeight: 52,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(6,182,212,0.85)',
    letterSpacing: 2,
    lineHeight: 17,
    marginTop: 4,
  },
  spinner: {
    position: 'absolute',
    bottom: 80,
  },
});
