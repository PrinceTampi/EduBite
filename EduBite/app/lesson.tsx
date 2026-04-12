import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

const LESSON_EMOJIS: Record<number, string> = {
  1:'🌍',2:'🌿',3:'🧬',4:'💧',5:'⚡',6:'🧠',7:'⚛️',
  8:'🌐',9:'🖥️',10:'🐍',11:'🔐',12:'🗄️',13:'☁️',14:'🔌',
  15:'📖',16:'🇯🇵',17:'🇪🇸',18:'🗣️',19:'🐠',20:'🌋',21:'🌴',
};

function extractKeyPoints(content: string) {
  const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
  const icons = ['💡', '🔑', '📌', '✨'];
  return Array.from({ length: Math.min(3, sentences.length) }, (_, i) => ({
    icon: icons[i % icons.length],
    text: sentences[Math.min(i * 2, sentences.length - 1)].trim(),
  }));
}

function estimateReadingTime(content: string) {
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default function LessonScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const numericId = parseInt(lessonId ?? '1', 10);

  const lesson = useQuery(api.lessons.getLesson, { lessonId: numericId });
  const allLessons = useQuery(api.lessons.getLessons);

  if (!lesson) {
    return (
      <View style={styles.loading}>
        <Text style={{ fontSize: 32 }}>📖</Text>
        <Text style={styles.loadingText}>Loading lesson...</Text>
      </View>
    );
  }

  const totalLessons = allLessons?.length ?? 21;
  const currentIndex = allLessons?.findIndex(l => l.lessonId === lesson.lessonId) ?? 0;
  const keyPoints = extractKeyPoints(lesson.content);
  const readingMins = estimateReadingTime(lesson.content);

  return (
    <View style={styles.page}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: '50%' }]} />
        </View>
        <Text style={styles.stepText}>{currentIndex + 1}/{totalLessons}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.lessonHeader}>
          <View style={styles.dayBadge}>
            <Text style={styles.dayBadgeText}>📅 Day {lesson.dayNumber}</Text>
          </View>
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
        </View>

        {/* Content Card */}
        <View style={styles.lessonCard}>
          <View style={styles.iconWrapper}>
            <Text style={{ fontSize: 36 }}>{LESSON_EMOJIS[lesson.lessonId] ?? '📚'}</Text>
          </View>
          <Text style={styles.lessonContent}>{lesson.content}</Text>

          {keyPoints.length > 0 && (
            <View style={styles.keyPoints}>
              <Text style={styles.keyPointsTitle}>KEY TAKEAWAYS</Text>
              {keyPoints.map((kp, i) => (
                <View key={i} style={styles.keyPoint}>
                  <View style={styles.keyPointIcon}>
                    <Text style={{ fontSize: 14 }}>{kp.icon}</Text>
                  </View>
                  <Text style={styles.keyPointText}>{kp.text}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Timer */}
        <View style={styles.timerRow}>
          <View style={styles.timerBadge}>
            <Text style={styles.timerText}>⏱️ Estimated reading: <Text style={styles.timerHighlight}>~{readingMins} min</Text></Text>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.quizBtn}
          onPress={() => router.push({ pathname: '/quiz', params: { lessonId: lesson.lessonId.toString() } })}
          activeOpacity={0.85}
        >
          <Text style={styles.quizBtnText}>Take the Quiz 🎯</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F7F7F7' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F7F7', gap: 12 },
  loadingText: { fontSize: 16, color: '#6b7280', fontWeight: '600' },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16, backgroundColor: '#F7F7F7' },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff', borderWidth: 2, borderColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },
  backBtnText: { fontSize: 20, color: '#1a1a2e' },
  progressBarTrack: { flex: 1, height: 10, backgroundColor: '#e5e7eb', borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#58CC02', borderRadius: 5 },
  stepText: { fontSize: 14, fontWeight: '700', color: '#6b7280' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  lessonHeader: { alignItems: 'center', paddingVertical: 16 },
  dayBadge: { backgroundColor: '#d4f5b0', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 24, marginBottom: 16 },
  dayBadgeText: { fontSize: 13, fontWeight: '700', color: '#46a302' },
  lessonTitle: { fontSize: 26, fontWeight: '800', color: '#1a1a2e', letterSpacing: -0.5, textAlign: 'center', lineHeight: 34 },
  lessonCard: { backgroundColor: '#fff', borderRadius: 20, padding: 28, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4 },
  iconWrapper: { width: 72, height: 72, borderRadius: 20, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center', marginBottom: 24, alignSelf: 'center' },
  lessonContent: { fontSize: 16, lineHeight: 28, color: '#374151', fontWeight: '400' },
  keyPoints: { marginTop: 28, paddingTop: 24, borderTopWidth: 2, borderTopColor: '#F7F7F7' },
  keyPointsTitle: { fontSize: 13, fontWeight: '800', color: '#1a1a2e', letterSpacing: 0.5, marginBottom: 16 },
  keyPoint: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10 },
  keyPointIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#d4f5b0', justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginTop: 2 },
  keyPointText: { fontSize: 14, color: '#1a1a2e', fontWeight: '500', lineHeight: 22, flex: 1 },
  timerRow: { alignItems: 'center', marginBottom: 24 },
  timerBadge: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  timerText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  timerHighlight: { color: '#46a302', fontWeight: '800' },
  quizBtn: { backgroundColor: '#58CC02', borderRadius: 14, padding: 18, alignItems: 'center', shadowColor: '#58CC02', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8, marginBottom: 8 },
  quizBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
