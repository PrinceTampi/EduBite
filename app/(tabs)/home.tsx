import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Modal, Animated,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { getSession, Session } from '@/lib/session';
import { Id } from '@/convex/_generated/dataModel';

const CATEGORY_ICONS: Record<string, string> = {
  Science: '🔬', IT: '💻', Language: '🌍', Nature: '🌿',
};
const LESSON_EMOJIS: Record<number, string> = {
  1:'🌍',2:'🌿',3:'🧬',4:'💧',5:'⚡',6:'🧠',7:'⚛️',
  8:'🌐',9:'🖥️',10:'🐍',11:'🔐',12:'🗄️',13:'☁️',14:'🔌',
  15:'📖',16:'🇯🇵',17:'🇪🇸',18:'🗣️',19:'🐠',20:'🌋',21:'🌴',
};
const MAX_ENERGY = 20;

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getUserName(email: string) {
  const name = email.split('@')[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export default function HomeScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [noEnergyModal, setNoEnergyModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const regenEnergy = useMutation(api.progress.regenerateEnergy);
  const consumeEnergy = useMutation(api.progress.consumeEnergy);

  const lessons = useQuery(api.lessons.getLessons);
  const progress = useQuery(
    api.progress.getProgress,
    session?.userId ? { userId: session.userId as Id<'users'> } : 'skip'
  );

  useEffect(() => {
    getSession().then((s) => {
      if (!s) { router.replace('/(auth)/login'); return; }
      setSession(s);
    });
  }, []);

  useEffect(() => {
    if (session?.userId) {
      regenEnergy({ userId: session.userId as Id<'users'> });
    }
  }, [session]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (session?.userId) {
      await regenEnergy({ userId: session.userId as Id<'users'> });
    }
    setRefreshing(false);
  }, [session]);

  async function startLesson(lessonId: number) {
    if (!session?.userId) return;
    try {
      await consumeEnergy({ userId: session.userId as Id<'users'> });
      router.push({ pathname: '/lesson', params: { lessonId: lessonId.toString() } });
    } catch {
      setNoEnergyModal(true);
    }
  }

  const energy = progress?.energy ?? 20;
  const energyPct = (energy / MAX_ENERGY) * 100;
  const completedLessons = progress?.completedLessons ?? [];
  const sortedLessons = lessons ? [...lessons].sort((a, b) => a.lessonId - b.lessonId) : [];

  // Group lessons by category
  const categories = ['Science', 'IT', 'Language', 'Nature'];
  const lessonsByCategory: Record<string, typeof sortedLessons> = {};
  categories.forEach(cat => {
    lessonsByCategory[cat] = sortedLessons.filter(l => l.category === cat);
  });

  // Today's lesson = first incomplete
  const todayLesson = sortedLessons.find(l => !completedLessons.includes(l.lessonId)) || sortedLessons[0];

  if (!session) return null;

  return (
    <>
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#58CC02" />}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <Text style={styles.topLogo}>Edu<Text style={{ color: '#58CC02' }}>Bite</Text></Text>
          <View style={styles.streakBadge}>
            <Text style={styles.streakFlame}>🔥</Text>
            <Text style={styles.streakText}>{progress?.streak ?? 0} day streak</Text>
          </View>
        </View>

        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>{getTimeGreeting()}, {getUserName(session.email)}! 👋</Text>
          <Text style={styles.greetingSub}>Ready for today's lesson?</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.coinsCard]}>
            <Text style={styles.statIcon}>💰</Text>
            <Text style={styles.statValue}>{progress?.coins ?? 0}</Text>
            <Text style={styles.statLabel}>COINS</Text>
          </View>
          <View style={[styles.statCard, styles.scoreCard]}>
            <Text style={styles.statIcon}>⭐</Text>
            <Text style={styles.statValue}>{progress?.totalScore ?? 0}</Text>
            <Text style={styles.statLabel}>TOTAL SCORE</Text>
          </View>
        </View>

        {/* Energy Bar */}
        <View style={styles.energyCard}>
          <View style={styles.energyHeader}>
            <Text style={styles.energyLabel}>⚡ Energy</Text>
            <Text style={styles.energyCount}>{energy}/{MAX_ENERGY}</Text>
          </View>
          <View style={styles.energyTrack}>
            <View
              style={[
                styles.energyFill,
                energyPct <= 25 && styles.energyLow,
                energyPct > 25 && energyPct <= 60 && styles.energyMedium,
                { width: `${energyPct}%` as any },
              ]}
            />
          </View>
          {energy < MAX_ENERGY && (
            <Text style={styles.energyRefill}>⚡ Refills 1 per 10 minutes</Text>
          )}
        </View>

        {/* Today's Lesson CTA */}
        {todayLesson && (
          <View style={styles.dailySection}>
            <Text style={styles.sectionTitle}>Today's Lesson</Text>
            <TouchableOpacity style={styles.dailyCard} onPress={() => startLesson(todayLesson.lessonId)} activeOpacity={0.85}>
              <Text style={styles.dailyEmoji}>{LESSON_EMOJIS[todayLesson.lessonId] ?? '📖'}</Text>
              <Text style={styles.dailyTitle}>{todayLesson.title}</Text>
              <Text style={styles.dailyDesc}>Tap to start your 5-minute lesson</Text>
              <View style={styles.dailyBtn}>
                <Text style={styles.dailyBtnText}>Start Learning →</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* All Lessons */}
        <View style={styles.lessonsSection}>
          <Text style={styles.sectionTitle}>All Lessons</Text>
          {categories.map(cat => {
            const catLessons = lessonsByCategory[cat] || [];
            if (!catLessons.length) return null;
            return (
              <View key={cat}>
                {/* Category Header */}
                <View style={styles.catHeader}>
                  <Text style={styles.catIcon}>{CATEGORY_ICONS[cat]}</Text>
                  <Text style={styles.catName}>{cat.toUpperCase()}</Text>
                  <View style={styles.catLine} />
                </View>
                {catLessons.map((lesson, idx) => {
                  const isCompleted = completedLessons.includes(lesson.lessonId);
                  const prevId = catLessons[idx - 1]?.lessonId;
                  const isAvailable = idx === 0 || completedLessons.includes(prevId);
                  return (
                    <TouchableOpacity
                      key={lesson.lessonId}
                      style={styles.lessonItem}
                      onPress={() => isAvailable ? startLesson(lesson.lessonId) : null}
                      activeOpacity={isAvailable ? 0.7 : 1}
                    >
                      <View style={[styles.lessonNum, isCompleted ? styles.numCompleted : isAvailable ? styles.numAvailable : styles.numLocked]}>
                        <Text style={{ fontSize: 18 }}>
                          {isCompleted ? '✅' : isAvailable ? LESSON_EMOJIS[lesson.lessonId] : '🔒'}
                        </Text>
                      </View>
                      <View style={styles.lessonInfo}>
                        <Text style={styles.lessonTitle}>{lesson.title}</Text>
                        <Text style={styles.lessonSub}>Day {lesson.dayNumber} · {lesson.category}</Text>
                      </View>
                      <Text style={styles.lessonArrow}>{isAvailable ? '›' : ''}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* No Energy Modal */}
      <Modal visible={noEnergyModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalIcon}>⚡</Text>
            <Text style={styles.modalTitle}>Not Enough Energy!</Text>
            <Text style={styles.modalDesc}>
              You need 5 energy to start a lesson. Energy regenerates 1 point every 10 minutes. Come back soon!
            </Text>
            <TouchableOpacity style={styles.modalBtn} onPress={() => setNoEnergyModal(false)}>
              <Text style={styles.modalBtnText}>Got It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F7F7F7' },
  scroll: { paddingBottom: 24, paddingHorizontal: 16 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 56, paddingBottom: 12 },
  topLogo: { fontSize: 22, fontWeight: '800', color: '#1a1a2e' },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff3e0', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 24 },
  streakFlame: { fontSize: 18 },
  streakText: { fontSize: 14, fontWeight: '700', color: '#ff9500' },
  greeting: { paddingVertical: 16 },
  greetingText: { fontSize: 26, fontWeight: '800', color: '#1a1a2e', letterSpacing: -0.5 },
  greetingSub: { fontSize: 15, color: '#6b7280', marginTop: 6, fontWeight: '500' },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 16, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  coinsCard: { backgroundColor: '#fffbeb', borderWidth: 2, borderColor: '#fde68a' },
  scoreCard: { backgroundColor: '#f0fdf4', borderWidth: 2, borderColor: '#bbf7d0' },
  statIcon: { fontSize: 32, marginBottom: 8 },
  statValue: { fontSize: 28, fontWeight: '800', color: '#1a1a2e' },
  statLabel: { fontSize: 11, fontWeight: '700', color: '#6b7280', letterSpacing: 0.5, marginTop: 4 },
  energyCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  energyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  energyLabel: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  energyCount: { fontSize: 15, fontWeight: '800', color: '#46a302' },
  energyTrack: { height: 14, backgroundColor: '#e5e7eb', borderRadius: 7, overflow: 'hidden' },
  energyFill: { height: '100%', backgroundColor: '#58CC02', borderRadius: 7 },
  energyLow: { backgroundColor: '#ef4444' },
  energyMedium: { backgroundColor: '#f59e0b' },
  energyRefill: { marginTop: 8, fontSize: 12, color: '#6b7280', fontWeight: '600', textAlign: 'right' },
  dailySection: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1a1a2e', marginBottom: 14, letterSpacing: -0.3 },
  dailyCard: { backgroundColor: '#58CC02', borderRadius: 20, padding: 28, shadowColor: '#58CC02', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
  dailyEmoji: { fontSize: 40, marginBottom: 12 },
  dailyTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 6 },
  dailyDesc: { fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: '500', marginBottom: 20 },
  dailyBtn: { alignSelf: 'flex-start', backgroundColor: '#fff', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  dailyBtnText: { fontSize: 15, fontWeight: '700', color: '#46a302' },
  lessonsSection: { marginBottom: 24 },
  catHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20, marginBottom: 8 },
  catIcon: { fontSize: 22 },
  catName: { fontSize: 14, fontWeight: '800', color: '#1a1a2e', letterSpacing: 0.5 },
  catLine: { flex: 1, height: 2, backgroundColor: '#e5e7eb', borderRadius: 1 },
  lessonItem: { backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  lessonNum: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  numCompleted: { backgroundColor: '#d4f5b0' },
  numAvailable: { backgroundColor: '#eff6ff' },
  numLocked: { backgroundColor: '#f3f4f6' },
  lessonInfo: { flex: 1 },
  lessonTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 3 },
  lessonSub: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  lessonArrow: { fontSize: 22, color: '#9ca3af', fontWeight: '300' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { backgroundColor: '#fff', borderRadius: 24, padding: 32, width: '100%', maxWidth: 340, alignItems: 'center' },
  modalIcon: { fontSize: 56, marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a2e', marginBottom: 8 },
  modalDesc: { fontSize: 14, color: '#6b7280', fontWeight: '500', lineHeight: 22, textAlign: 'center', marginBottom: 24 },
  modalBtn: { width: '100%', backgroundColor: '#58CC02', borderRadius: 12, padding: 14, alignItems: 'center' },
  modalBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
