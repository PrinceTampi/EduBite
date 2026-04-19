import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Modal, Animated, Dimensions, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { getSession, Session } from '@/lib/session';
import { Id } from '@/convex/_generated/dataModel';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const LESSON_EMOJIS: Record<number, string> = {
  1:'🌍',2:'🌿',3:'🧬',4:'💧',5:'⚡',6:'🧠',7:'⚛️',
  8:'🌐',9:'🖥️',10:'🐍',11:'🔐',12:'🗄️',13:'☁️',14:'🔌',
  15:'📖',16:'🇯🇵',17:'🇪🇸',18:'🗣️',19:'🐠',20:'🌋',21:'🌴',
};
const MAX_ENERGY = 20;

const MOTIVATIONAL_MESSAGES = [
  'Every lesson makes you smarter! 🧠',
  'You\'re on fire today! Keep going! 🔥',
  'One more lesson and you\'ll be unstoppable! 💪',
  'Knowledge is your superpower! ⚡',
  'Great learners never quit! 🚀',
];

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

/* ============ Status Item ============ */
function StatusItem({ icon, value, bgColor }: { icon: string; value: string | number; bgColor: string }) {
  return (
    <View style={[styles.statusItem, { backgroundColor: bgColor }]}>
      <Text style={styles.statusIcon}>{icon}</Text>
      <Text style={styles.statusValue}>{value}</Text>
    </View>
  );
}

/* ============ Learning Path Node ============ */
function PathNode({
  lesson,
  index,
  isCompleted,
  isCurrent,
  isLocked,
  bounceAnim,
  onPress,
}: {
  lesson: any;
  index: number;
  isCompleted: boolean;
  isCurrent: boolean;
  isLocked: boolean;
  bounceAnim: Animated.Value;
  onPress: () => void;
}) {
  const emoji = LESSON_EMOJIS[lesson.lessonId] || '📖';

  // Zigzag offset
  const offset = index % 3 === 1 ? -50 : index % 3 === 2 ? 50 : 0;

  return (
    <Animated.View
      style={[
        styles.pathNodeWrap,
        { transform: [{ translateX: offset }, ...(isCurrent ? [{ scale: bounceAnim }] : [])] },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.nodeCircle,
          isCompleted && styles.nodeCompleted,
          isCurrent && styles.nodeCurrent,
          isLocked && styles.nodeLocked,
        ]}
        onPress={onPress}
        disabled={isLocked}
        activeOpacity={0.7}
      >
        <Text style={[styles.nodeEmoji, isLocked && styles.nodeEmojiLocked]}>
          {isCompleted ? '✅' : emoji}
        </Text>
        {isCompleted && (
          <View style={styles.nodeCheck}>
            <Text style={styles.nodeCheckText}>⭐</Text>
          </View>
        )}
      </TouchableOpacity>
      <Text style={[styles.nodeTitle, isLocked && styles.nodeTitleLocked]} numberOfLines={2}>
        {lesson.title}
      </Text>
    </Animated.View>
  );
}

/* ============ Reward Chest ============ */
function RewardChest() {
  const sparkle = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkle, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
        Animated.timing(sparkle, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.chestWrap}>
      <View style={styles.chestCircle}>
        <Text style={styles.chestIcon}>🎁</Text>
        <Animated.Text style={[styles.chestSparkle, { opacity: sparkle }]}>✨</Animated.Text>
      </View>
      <Text style={styles.chestLabel}>Milestone Reward</Text>
    </View>
  );
}

/* ============ Path Line ============ */
function PathLine({ type }: { type: 'completed' | 'current' | 'locked' }) {
  const colors = {
    completed: ['#58CC02', '#46a302'],
    current: ['#58CC02', '#e5e7eb'],
    locked: ['#e5e7eb', '#e5e7eb'],
  };
  return (
    <LinearGradient colors={colors[type]} style={styles.pathLine} />
  );
}

/* ============ Learning Path ============ */
function LearningPath({
  lessons,
  completedLessons,
  onLessonPress,
  bounceAnim,
}: {
  lessons: any[];
  completedLessons: number[];
  onLessonPress: (lessonId: number) => void;
  bounceAnim: Animated.Value;
}) {
  const pathNodes = lessons.slice(0, 12);

  return (
    <View style={styles.pathContainer}>
      {pathNodes.map((lesson, index) => {
        const isCompleted = completedLessons.includes(lesson.lessonId);
        const isCurrent = !isCompleted && (index === 0 || completedLessons.includes(pathNodes[index - 1]?.lessonId));
        const isLocked = !isCompleted && !isCurrent;

        const showChest = index > 0 && index % 4 === 0;

        const lineType = isCompleted ? 'completed' : isCurrent ? 'current' : 'locked';

        return (
          <View key={lesson.lessonId || index}>
            {/* Connecting line */}
            {index > 0 && <PathLine type={lineType} />}

            {/* Reward chest at milestones */}
            {showChest && (
              <>
                <RewardChest />
                <PathLine type={lineType} />
              </>
            )}

            {/* Lesson node */}
            <PathNode
              lesson={lesson}
              index={index}
              isCompleted={isCompleted}
              isCurrent={isCurrent}
              isLocked={isLocked}
              bounceAnim={bounceAnim}
              onPress={() => onLessonPress(lesson.lessonId)}
            />
          </View>
        );
      })}
    </View>
  );
}

/* ============ MAIN HOME SCREEN ============ */
export default function HomeScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [noEnergyModal, setNoEnergyModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [bounceAnim] = useState(new Animated.Value(1));
  const mascotAnim = useRef(new Animated.Value(0)).current;

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

  // Bounce animation for current lesson
  useEffect(() => {
    const bounce = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    bounce.start();
    return () => bounce.stop();
  }, []);

  // Mascot bobbing animation
  useEffect(() => {
    const bob = Animated.loop(
      Animated.sequence([
        Animated.timing(mascotAnim, { toValue: -3, duration: 1500, useNativeDriver: true }),
        Animated.timing(mascotAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    );
    bob.start();
    return () => bob.stop();
  }, []);

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
  const todayLesson = sortedLessons.find(l => !completedLessons.includes(l.lessonId)) || sortedLessons[0];

  // Daily challenge progress
  const dailyProgress = Math.min(completedLessons.length, 3);
  const dailyProgressPct = (dailyProgress / 3) * 100;

  // XP / Level
  const totalScore = progress?.totalScore ?? 0;
  const level = Math.floor(totalScore / 100) + 1;
  const xpInLevel = totalScore % 100;
  const xpPct = (xpInLevel / 100) * 100;

  // Energy fill color
  const energyFillColor = energy <= 5 ? ['#FF4B4B', '#FF6B6B'] : energy <= 10 ? ['#FF9500', '#FFAB40'] : ['#1CB0F6', '#49C7F8'];

  // Motivational message
  const motiveMsg = MOTIVATIONAL_MESSAGES[Math.floor(completedLessons.length % MOTIVATIONAL_MESSAGES.length)];

  const userName = session ? getUserName(session.email) : 'Learner';

  if (!session) return null;

  return (
    <>
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#58CC02" />}
        showsVerticalScrollIndicator={false}
      >
        {/* ===== TOP BAR ===== */}
        <View style={styles.topBar}>
          <View style={styles.topBarLogo}>
            <Animated.View style={[styles.logoMascot, { transform: [{ translateY: mascotAnim }] }]}>
              <Text style={styles.logoMascotText}>🧠</Text>
            </Animated.View>
            <Text style={styles.logoText}>
              Edu<Text style={styles.logoTextGreen}>Bite</Text>
            </Text>
          </View>
          <TouchableOpacity style={styles.avatarCircle} onPress={() => router.push('/profile')}>
            <Text style={styles.avatarLetter}>{userName.charAt(0)}</Text>
          </TouchableOpacity>
        </View>

        {/* ===== UNIFIED STATUS BAR ===== */}
        <View style={styles.statusBar}>
          <StatusItem icon="🔥" value={progress?.streak ?? 0} bgColor="#FFF3E0" />
          <StatusItem icon="⚡" value={energy} bgColor="#E6F7FF" />
          <StatusItem icon="🪙" value={progress?.coins ?? 0} bgColor="#FFF9E0" />
          <StatusItem icon="⭐" value={progress?.totalScore ?? 0} bgColor="#F5ECFF" />
        </View>

        {/* ===== XP BAR ===== */}
        <View style={styles.xpSection}>
          <View style={styles.xpHeader}>
            <LinearGradient colors={['#FFC800', '#FFB800']} style={styles.xpBadge}>
              <Text style={styles.xpBadgeText}>⭐ Level {level}</Text>
            </LinearGradient>
            <Text style={styles.xpCount}>{xpInLevel} / 100 XP</Text>
          </View>
          <View style={styles.xpTrack}>
            <LinearGradient
              colors={['#FFC800', '#FF9500']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.xpFill, { width: `${Math.max(xpPct, 8)}%` }]}
            />
          </View>
        </View>

        {/* ===== GREETING ===== */}
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>
            {getTimeGreeting()}, {userName}! 👋
          </Text>
          <Text style={styles.greetingSub}>
            Keep going, <Text style={styles.greetingHighlight}>{userName}</Text>! 💪
          </Text>
        </View>

        {/* ===== DAILY CHALLENGE ===== */}
        <View style={styles.dailyChallenge}>
          <View style={styles.dcHeader}>
            <Text style={styles.dcIcon}>🔥</Text>
            <Text style={styles.dcTitle}>Daily Challenge</Text>
          </View>
          <Text style={styles.dcDesc}>Solve 3 lessons today to earn bonus coins!</Text>
          <View style={styles.dcTrack}>
            <LinearGradient
              colors={['#FF9500', '#FF6B00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.dcFill, { width: `${Math.max(dailyProgressPct, 5)}%` }]}
            />
          </View>
          <Text style={styles.dcProgressText}>{dailyProgress}/3 completed</Text>
        </View>

        {/* ===== TODAY'S LESSON CTA ===== */}
        <TouchableOpacity
          style={styles.dailyLessonCard}
          onPress={() => todayLesson && startLesson(todayLesson.lessonId)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#58CC02', '#46a302']}
            style={styles.dlcGradient}
          >
            <View style={styles.dlcTop}>
              <Text style={styles.dlcEmoji}>
                {todayLesson ? LESSON_EMOJIS[todayLesson.lessonId] || '📖' : '🎉'}
              </Text>
              <View style={styles.dlcInfo}>
                <Text style={styles.dlcTitle}>
                  {todayLesson?.title || 'All Lessons Complete!'}
                </Text>
                <Text style={styles.dlcDesc}>
                  {todayLesson
                    ? `Day ${todayLesson.dayNumber || todayLesson.lessonId} • Costs 5 ⚡`
                    : "Amazing! You've finished all lessons."}
                </Text>
              </View>
            </View>
            <View style={styles.dlcBtn}>
              <Text style={styles.dlcBtnText}>
                {todayLesson ? 'Start Learning' : 'Review Lessons'} →
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* ===== LEARNING PATH ===== */}
        <View style={styles.pathSection}>
          <Text style={styles.pathSectionTitle}>🗺️ Your Learning Journey</Text>
          <LearningPath
            lessons={sortedLessons}
            completedLessons={completedLessons}
            onLessonPress={startLesson}
            bounceAnim={bounceAnim}
          />
        </View>

        {/* ===== AI TUTOR CARD ===== */}
        <TouchableOpacity
          style={styles.aiTutorBtn}
          onPress={() => router.push('/tutor')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#6366f1', '#8b5cf6']}
            style={styles.aiTutorGradient}
          >
            <View style={styles.aiTutorIconWrap}>
              <Text style={styles.aiTutorIcon}>🤖</Text>
            </View>
            <View style={styles.aiTutorText}>
              <Text style={styles.aiTutorTitle}>Ask AI Tutor</Text>
              <Text style={styles.aiTutorSub}>Get instant help anytime!</Text>
            </View>
            <Text style={styles.aiTutorArrow}>→</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* ===== MOTIVATIONAL BANNER ===== */}
        <View style={styles.motiveBanner}>
          <Text style={styles.motiveEmoji}>🚀</Text>
          <Text style={styles.motiveText}>{motiveMsg}</Text>
        </View>
      </ScrollView>

      {/* ===== NO ENERGY MODAL ===== */}
      <Modal visible={noEnergyModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalIcon}>⚡</Text>
            <Text style={styles.modalTitle}>Out of Energy!</Text>
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

/* ============ STYLES ============ */
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F0F4F0' },
  scroll: { paddingBottom: 32, paddingHorizontal: 16 },

  /* Top Bar */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 8,
  },
  topBarLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoMascot: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#58CC02',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#58CC02',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoMascotText: { fontSize: 22 },
  logoText: { fontSize: 22, fontWeight: '900', color: '#1a1a2e', letterSpacing: -0.5 },
  logoTextGreen: { color: '#58CC02' },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#CE82FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarLetter: { fontSize: 18, fontWeight: '800', color: '#fff' },

  /* Status Bar */
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 12,
    marginTop: 8,
    marginBottom: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    flex: 1,
    justifyContent: 'center',
  },
  statusIcon: { fontSize: 18 },
  statusValue: { fontSize: 14, fontWeight: '800', color: '#1a1a2e' },

  /* XP Bar */
  xpSection: { marginBottom: 16 },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  xpBadge: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    shadowColor: '#FFC800',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  xpBadgeText: { fontSize: 12, fontWeight: '900', color: '#1a1a2e' },
  xpCount: { fontSize: 13, fontWeight: '700', color: '#6b7280' },
  xpTrack: {
    height: 14,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    borderRadius: 8,
    minWidth: 24,
  },

  /* Greeting */
  greeting: { paddingVertical: 8, marginBottom: 16 },
  greetingText: { fontSize: 24, fontWeight: '900', color: '#1a1a2e', letterSpacing: -0.5 },
  greetingSub: { fontSize: 15, color: '#6b7280', marginTop: 4, fontWeight: '700' },
  greetingHighlight: { color: '#58CC02' },

  /* Daily Challenge */
  dailyChallenge: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 5,
    borderLeftColor: '#FF9500',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  dcHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  dcIcon: { fontSize: 24 },
  dcTitle: { fontSize: 17, fontWeight: '900', color: '#1a1a2e' },
  dcDesc: { fontSize: 14, color: '#6b7280', fontWeight: '700', marginBottom: 12 },
  dcTrack: {
    height: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 6,
  },
  dcFill: { height: '100%', borderRadius: 6 },
  dcProgressText: { fontSize: 12, color: '#6b7280', fontWeight: '800', textAlign: 'right' },

 

  /* Today's Lesson CTA */
  dailyLessonCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#58CC02',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  dlcGradient: { padding: 24 },
  dlcTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  dlcEmoji: { fontSize: 44 },
  dlcInfo: { flex: 1 },
  dlcTitle: { fontSize: 18, fontWeight: '900', color: '#fff', marginBottom: 2 },
  dlcDesc: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: '700' },
  dlcBtn: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dlcBtnText: { fontSize: 16, fontWeight: '900', color: '#3a8a01' },

  /* Learning Path */
  pathSection: { marginBottom: 24 },
  pathSectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1a1a2e',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  pathContainer: { alignItems: 'center' },
  pathNodeWrap: { alignItems: 'center', marginBottom: 8 },
  pathLine: {
    width: 4,
    height: 32,
    borderRadius: 2,
    alignSelf: 'center',
  },
  nodeCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'transparent',
    position: 'relative',
  },
  nodeCompleted: {
    backgroundColor: '#58CC02',
    borderColor: '#46a302',
    shadowColor: '#58CC02',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  nodeCurrent: {
    backgroundColor: '#fff',
    borderWidth: 5,
    borderColor: '#58CC02',
    shadowColor: '#58CC02',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  nodeLocked: {
    backgroundColor: '#E5E7EB',
    borderColor: '#D1D5DB',
    opacity: 0.7,
  },
  nodeEmoji: { fontSize: 30, lineHeight: 36 },
  nodeEmojiLocked: { opacity: 0.4 },
  nodeCheck: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFC800',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  nodeCheckText: { fontSize: 12 },
  nodeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1a1a2e',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 100,
  },
  nodeTitleLocked: { color: '#9ca3af' },

  /* Chest */
  chestWrap: { alignItems: 'center', marginVertical: 8 },
  chestCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FFC800',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFC800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 5,
    position: 'relative',
  },
  chestIcon: { fontSize: 28 },
  chestSparkle: { position: 'absolute', top: -6, right: -6, fontSize: 16 },
  chestLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF9500',
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  /* AI Tutor */
  aiTutorBtn: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  aiTutorGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  aiTutorIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  aiTutorIcon: { fontSize: 28 },
  aiTutorText: { flex: 1 },
  aiTutorTitle: { fontSize: 17, fontWeight: '900', color: '#fff', marginBottom: 2 },
  aiTutorSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '700' },
  aiTutorArrow: { fontSize: 20, color: 'rgba(255,255,255,0.8)' },

  /* Motivational Banner */
  motiveBanner: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  motiveEmoji: { fontSize: 40, marginBottom: 8 },
  motiveText: { fontSize: 16, fontWeight: '800', color: '#1a1a2e', textAlign: 'center', lineHeight: 24 },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 36,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalIcon: { fontSize: 56, marginBottom: 16 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#1a1a2e', marginBottom: 8 },
  modalDesc: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '700',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalBtn: {
    width: '100%',
    backgroundColor: '#58CC02',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#58CC02',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalBtnText: { color: '#fff', fontSize: 17, fontWeight: '900' },

  nodeGlow: {},
});
