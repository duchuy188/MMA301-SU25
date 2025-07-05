import { View, Text, StyleSheet } from 'react-native';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { Film } from 'lucide-react-native';

export default function SplashScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/auth');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Film size={80} color="#FFD700" />
        <Text style={styles.title}>LUXURY CINEMA</Text>
        <Text style={styles.subtitle}>Trải nghiệm điện ảnh đẳng cấp</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    gap: 20,
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 32,
    color: '#FFD700',
    textAlign: 'center',
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    color: '#F7E7CE',
    textAlign: 'center',
    opacity: 0.9,
  },
});