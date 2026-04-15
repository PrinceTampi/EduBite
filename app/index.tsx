import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { getSession } from '@/lib/session';


export default function SplashScreen() {
  const fillAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const seedLessons = useMutation(api.lessons.seedLessons);
  const seedQuizzes = useMutation(api.quizzes.seedQuizzes);
  const seedDemoUser = useMutation(api.seed.seedDemoUser);


  useEffect(() => {
    // Fade + scale in
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    // Progress bar
    Animated.timing(fillAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start();

    async function init() {
      try {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000));
        await Promise.race([
          Promise.all([seedLessons(), seedQuizzes(), seedDemoUser()]),
          timeoutPromise
        ]);
      } catch (err) {
        console.warn('Seeding failed or timed out:', err);
      }

      const session = await getSession();
      setTimeout(() => {
        if (session?.userId) {
          router.replace('/(tabs)/home');
        } else {
          router.replace('/(auth)/login');
        }
      }, 2200);
    }

    init();
  }, []);

  const barWidth = fillAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>🧠</Text>
        </View>
        <Text style={styles.title}>EduBite</Text>
        <Text style={styles.subtitle}>5 Minute Learning App</Text>

        <View style={styles.loaderBar}>
          <Animated.View style={[styles.loaderFill, { width: barWidth }]} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 32,
    backgroundColor: '#58CC02',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#58CC02',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  logoEmoji: {
    fontSize: 56,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a2e',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    marginTop: 8,
    fontWeight: '500',
  },
  loaderBar: {
    width: 200,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginTop: 40,
    overflow: 'hidden',
  },
  loaderFill: {
    height: '100%',
    backgroundColor: '#58CC02',
    borderRadius: 3,
  },
});
