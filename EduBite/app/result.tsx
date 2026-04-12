import { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { getSession, Session } from '@/lib/session';
import { Id } from '@/convex/_generated/dataModel';

function getMotivation(percent: number) {
  if (percent === 100) return { emoji: '🏆', title: 'Perfect Score!', sub: "Outstanding! You're a natural!" };
  if (percent >= 80) return { emoji: '🎉', title: 'Excellent Work!', sub: 'You really know your stuff!' };
  if (percent >= 60) return { emoji: '👍', title: 'Good Job!', sub: 'Solid effort, keep learning!' };
  if (percent >= 40) return { emoji: '💪', title: 'Keep Trying!', sub: 'Practice makes perfect!' };
  return { emoji: '📖', title: 'Room to Grow', sub: 'Review the lesson and try again!' };
}

export default function ResultScreen() {
  const { score: scoreStr, total: totalStr, lessonId: lessonIdStr } = useLocalSearchParams<{ score: string; total: string; lessonId: string }>();
  const score = parseInt(scoreStr ?? '0', 10);
  const total = parseInt(totalStr ?? '3', 10);
  const lessonId = parseInt(lessonIdStr ?? '1', 10);
  const percent = Math.round((score / total) * 100);

  const [session, setSession] = useState<Session | null>(null);
  const [saved, setSaved] = useState(false);
  const [updateResult, setUpdateResult] = useState<{ coinsEarned: number; newStreak: number } | null>(null);

  const ringAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const updateProgress = useMutation(api.progress.updateProgress);
  const lesson = useQuery(api.lessons.getLesson, { lessonId });

  useEffect(() => {
    getSession().then((s) => {
      if (!s) { router.replace('/(auth)/login'); return; }
      setSession(s);
    });

    // Animations
    Animated.parallel([
      Animated.spring(bounceAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(ringAnim, { toValue: percent / 100, duration: 1200, useNativeDriver: false }),
    ]).start();
  }, []);

  useEffect(() => {
    async function save() {
      if (!session || saved) return;
      setSaved(true);
      try {
        const result = await updateProgress({
          userId: session.userId as Id<'users'>,
          lessonId,
          score,
          total,
        });
        setUpdateResult(result);
      } catch {}
    }
    if (session) save();
  }, [session]);

  const lessonTitle = lesson?.title ?? `Lesson ${lessonId}`;
  const motivation = getMotivation(percent);
  const coinsEarned = updateResult?.coinsEarned ?? (percent === 100 ? 10 : percent >= 60 ? 5 : 2);
  const streak = updateResult?.newStreak ?? 0;

  // SVG-like ring using border trick
  const circumference = 2 * Math.PI * 60; // r=60
  const strokeOffset = ringAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.scroll}>
      {/* Hero */}
      <Animated.View style={[styles.hero, { opacity: fadeAnim }]}>
        <Animated.Text style={[styles.resultEmoji, { transform: [{ scale: bounceAnim }] }]}>
          {motivation.emoji}
        </Animated.Text>
        <Text style={styles.resultTitle}>{motivation.title}</Text>
        <Text style={styles.resultSub}>{lessonTitle} — {motivation.sub}</Text>
      </Animated.View>

      {/* Score Ring (Visual) */}
      <View style={styles.scoreRingSection}>
        <View style={[styles.scoreRing, percent >= 70 ? styles.ringGreen : percent >= 40 ? styles.ringOrange : styles.ringRed]}>
          <Text style={styles.scoreValue}>{score}/{total}</Text>
          <Text style={styles.scoreLabel}>SCORE</Text>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.resultStat}>
          <Text style={styles.resultStatIcon}>✅</Text>
          <Text style={styles.resultStatValue}>{score}</Text>
          <Text style={styles.resultStatLabel}>CORRECT</Text>
        </View>
        <View style={styles.resultStat}>
          <Text style={styles.resultStatIcon}>❌</Text>
          <Text style={styles.resultStatValue}>{total - score}</Text>
          <Text style={styles.resultStatLabel}>WRONG</Text>
        </View>
        <View style={styles.resultStat}>
          <Text style={styles.resultStatIcon}>💰</Text>
          <Text style={styles.resultStatValue}>+{coinsEarned}</Text>
          <Text style={styles.resultStatLabel}>COINS</Text>
        </View>
      </View>

      {/* Streak Banner */}
      <View style={styles.streakBanner}>
        <Text style={styles.streakFire}>🔥</Text>
        <View>
          <Text style={styles.streakTitle}>{streak}-day streak!</Text>
          <Text style={styles.streakSub}>
            {streak >= 7 ? '🏆 One week streak! Amazing!'
              : streak >= 3 ? '🌟 You\'re on fire! Keep going!'
              : 'Complete a lesson daily to build your streak!'}
          </Text>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(tabs)/home')} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>Continue Learning →</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.replace({ pathname: '/quiz', params: { lessonId: lessonId.toString() } })} activeOpacity={0.85}>
          <Text style={styles.secondaryBtnText}>Retry Quiz 🔄</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F7F7F7' },
  scroll: { paddingHorizontal: 16, paddingBottom: 48 },
  hero: { alignItems: 'center', paddingTop: 64, paddingBottom: 32 },
  resultEmoji: { fontSize: 80, marginBottom: 16 },
  resultTitle: { fontSize: 28, fontWeight: '800', color: '#1a1a2e', letterSpacing: -0.5, marginBottom: 8 },
  resultSub: { fontSize: 15, color: '#6b7280', fontWeight: '500', textAlign: 'center' },
  scoreRingSection: { alignItems: 'center', marginBottom: 32 },
  scoreRing: { width: 160, height: 160, borderRadius: 80, borderWidth: 12, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 6 },
  ringGreen: { borderColor: '#58CC02', backgroundColor: '#f0fdf4' },
  ringOrange: { borderColor: '#ff9500', backgroundColor: '#fff8f0' },
  ringRed: { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
  scoreValue: { fontSize: 40, fontWeight: '800', color: '#1a1a2e', lineHeight: 48 },
  scoreLabel: { fontSize: 12, fontWeight: '700', color: '#6b7280', letterSpacing: 0.5, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  resultStat: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  resultStatIcon: { fontSize: 28, marginBottom: 8 },
  resultStatValue: { fontSize: 22, fontWeight: '800', color: '#1a1a2e' },
  resultStatLabel: { fontSize: 11, fontWeight: '700', color: '#6b7280', letterSpacing: 0.3, marginTop: 4 },
  streakBanner: { backgroundColor: '#fff8f0', borderWidth: 2, borderColor: '#ffe0b2', borderRadius: 20, padding: 24, flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 32 },
  streakFire: { fontSize: 48 },
  streakTitle: { fontSize: 18, fontWeight: '800', color: '#1a1a2e', marginBottom: 4 },
  streakSub: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  actions: { gap: 12 },
  primaryBtn: { backgroundColor: '#58CC02', borderRadius: 14, padding: 18, alignItems: 'center', shadowColor: '#58CC02', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
  primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  secondaryBtn: { backgroundColor: '#fff', borderRadius: 14, padding: 18, alignItems: 'center', borderWidth: 2, borderColor: '#e5e7eb' },
  secondaryBtnText: { color: '#1a1a2e', fontSize: 16, fontWeight: '700' },
});
