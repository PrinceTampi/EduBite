import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { getSession, clearSession, Session } from '@/lib/session';
import { Id } from '@/convex/_generated/dataModel';

const TOTAL_LESSONS = 21;

const ACHIEVEMENTS = [
  { icon: '🌟', name: 'First Step', check: (p: any) => p.completedLessons.length >= 1 },
  { icon: '🔥', name: '3-Day Streak', check: (p: any) => p.streak >= 3 },
  { icon: '📚', name: 'Bookworm', check: (p: any) => p.completedLessons.length >= 5 },
  { icon: '🧭', name: 'Explorer', check: (p: any) => p.completedLessons.length >= 10 },
  { icon: '🏆', name: 'Week Warrior', check: (p: any) => p.streak >= 7 },
  { icon: '💯', name: 'High Scorer', check: (p: any) => p.totalScore >= 30 },
  { icon: '🌍', name: 'Polyglot', check: (p: any) => p.completedLessons.length >= 15 },
  { icon: '🧠', name: 'Scholar', check: (p: any) => p.totalScore >= 50 },
  { icon: '🎓', name: 'Graduated', check: (p: any) => p.completedLessons.length >= TOTAL_LESSONS },
];

function getUserName(email: string) {
  const name = email.split('@')[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function getAvatarLetter(email: string) {
  return email.charAt(0).toUpperCase();
}

export default function ProfileScreen() {
  const [session, setSession] = useState<Session | null>(null);

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

  async function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive', onPress: async () => {
          await clearSession();
          router.replace('/(auth)/login');
        }
      },
    ]);
  }

  if (!session) return null;

  const completed = progress?.completedLessons.length ?? 0;
  const totalPercent = Math.round((completed / TOTAL_LESSONS) * 100);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.scroll}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>Profile</Text>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getAvatarLetter(session.email)}</Text>
        </View>
        <Text style={styles.profileName}>{getUserName(session.email)}</Text>
        <Text style={styles.profileEmail}>{session.email}</Text>
        <View style={styles.profileBadge}>
          <Text style={styles.profileBadgeText}>🎓 EduBite Learner</Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.streakStat]}>
          <Text style={styles.statIcon}>🔥</Text>
          <Text style={styles.statValue}>{progress?.streak ?? 0}</Text>
          <Text style={styles.statLabel}>DAY STREAK</Text>
        </View>
        <View style={[styles.statCard, styles.scoreStat]}>
          <Text style={styles.statIcon}>⭐</Text>
          <Text style={styles.statValue}>{progress?.totalScore ?? 0}</Text>
          <Text style={styles.statLabel}>TOTAL SCORE</Text>
        </View>
        <View style={[styles.statCard, styles.lessonsStat]}>
          <Text style={styles.statIcon}>📚</Text>
          <Text style={styles.statValue}>{completed}</Text>
          <Text style={styles.statLabel}>LESSONS DONE</Text>
        </View>
        <View style={[styles.statCard, styles.coinsStat]}>
          <Text style={styles.statIcon}>💰</Text>
          <Text style={styles.statValue}>{progress?.coins ?? 0}</Text>
          <Text style={styles.statLabel}>COINS</Text>
        </View>
        <View style={[styles.statCard, styles.energyStat]}>
          <Text style={styles.statIcon}>⚡</Text>
          <Text style={styles.statValue}>{progress?.energy ?? 20}/20</Text>
          <Text style={styles.statLabel}>ENERGY</Text>
        </View>
      </View>

      {/* Course Progress */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Course Progress</Text>
          <Text style={styles.progressPct}>{totalPercent}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${totalPercent}%` as any }]} />
        </View>
        <Text style={styles.progressSub}>{completed} of {TOTAL_LESSONS} lessons completed</Text>
      </View>

      {/* Achievements */}
      <Text style={styles.sectionTitle}>Achievements</Text>
      <View style={styles.achievementsGrid}>
        {ACHIEVEMENTS.map((a) => {
          const unlocked = progress ? a.check(progress) : false;
          return (
            <View key={a.name} style={[styles.achievement, !unlocked && styles.achievementLocked]}>
              <Text style={styles.achievementIcon}>{a.icon}</Text>
              <Text style={styles.achievementName}>{a.name}</Text>
            </View>
          );
        })}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Text style={styles.logoutBtnText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F7F7F7' },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 56, paddingBottom: 12 },
  topTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a2e' },
  profileCard: { backgroundColor: '#fff', borderRadius: 20, padding: 32, alignItems: 'center', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#58CC02', justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: '#58CC02', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  avatarText: { fontSize: 40, fontWeight: '800', color: '#fff' },
  profileName: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', marginBottom: 4 },
  profileEmail: { fontSize: 14, color: '#6b7280', fontWeight: '500', marginBottom: 12 },
  profileBadge: { backgroundColor: '#d4f5b0', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  profileBadgeText: { fontSize: 12, fontWeight: '700', color: '#46a302' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statCard: { width: '47%', borderRadius: 16, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  streakStat: { backgroundColor: '#fff8f0', borderWidth: 2, borderColor: '#ffe0b2' },
  scoreStat: { backgroundColor: '#f0fdf4', borderWidth: 2, borderColor: '#bbf7d0' },
  lessonsStat: { backgroundColor: '#eff6ff', borderWidth: 2, borderColor: '#bfdbfe' },
  coinsStat: { backgroundColor: '#fffbeb', borderWidth: 2, borderColor: '#fde68a' },
  energyStat: { backgroundColor: '#f0fdf4', borderWidth: 2, borderColor: '#bbf7d0' },
  statIcon: { fontSize: 32, marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: '800', color: '#1a1a2e' },
  statLabel: { fontSize: 11, fontWeight: '700', color: '#6b7280', letterSpacing: 0.5, marginTop: 4 },
  progressCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  progressTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  progressPct: { fontSize: 14, fontWeight: '700', color: '#46a302' },
  progressTrack: { height: 12, backgroundColor: '#e5e7eb', borderRadius: 6, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: '#58CC02', borderRadius: 6 },
  progressSub: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1a1a2e', marginBottom: 16 },
  achievementsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 32 },
  achievement: { width: '30%', backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  achievementLocked: { opacity: 0.35 },
  achievementIcon: { fontSize: 32, marginBottom: 8 },
  achievementName: { fontSize: 11, fontWeight: '700', color: '#1a1a2e', textAlign: 'center', lineHeight: 16 },
  logoutBtn: { borderWidth: 2, borderColor: '#fecaca', borderRadius: 14, padding: 16, alignItems: 'center', backgroundColor: '#fff' },
  logoutBtnText: { color: '#ef4444', fontSize: 16, fontWeight: '700' },
});
