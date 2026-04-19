import { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type OptionState = 'none' | 'selected' | 'correct' | 'wrong' | 'dimmed';

export default function QuizScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const numericId = parseInt(lessonId ?? '1', 10);

  const dbQuestions = useQuery(api.quizzes.getQuizzesByLesson, { lessonId: numericId });

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [optionStates, setOptionStates] = useState<OptionState[]>([]);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const feedbackTranslate = useRef(new Animated.Value(120)).current;
  const questionFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (dbQuestions && dbQuestions.length > 0) {
      setQuestions(shuffleArray(dbQuestions));
    }
  }, [dbQuestions]);

  useEffect(() => {
    if (questions.length > 0 && currentIndex < questions.length) {
      const opts = shuffleArray(questions[currentIndex].options as string[]);
      setShuffledOptions(opts);
      setOptionStates(opts.map(() => 'none'));
      setAnswered(false);
      setFeedbackVisible(false);
      Animated.timing(feedbackTranslate, { toValue: 120, duration: 0, useNativeDriver: true }).start();
    }
  }, [questions, currentIndex]);

  function selectOption(idx: number) {
    if (answered) return;
    setAnswered(true);

    const q = questions[currentIndex];
    const selected = shuffledOptions[idx];
    const correct = selected === q.correctAnswer;

    if (correct) setScore(s => s + 1);
    setIsCorrect(correct);

    const newStates: OptionState[] = shuffledOptions.map((opt, i) => {
      if (i === idx) return correct ? 'correct' : 'wrong';
      if (opt === q.correctAnswer) return 'correct';
      return 'dimmed';
    });
    setOptionStates(newStates);

    setFeedbackVisible(true);
    Animated.spring(feedbackTranslate, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }).start();
  }

  function nextQuestion() {
    const next = currentIndex + 1;
    if (next >= questions.length) {
      // Go to result
      router.replace({
        pathname: '/result',
        params: { score: (isCorrect ? score : score).toString(), total: questions.length.toString(), lessonId: numericId.toString() },
      });
    } else {
      // Animate out and change question
      Animated.timing(questionFade, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setCurrentIndex(next);
        Animated.timing(questionFade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    }
  }

  function confirmExit() {
    Alert.alert('Exit Quiz', 'Are you sure? Your progress will be lost.', [
      { text: 'Stay', style: 'cancel' },
      { text: 'Exit', style: 'destructive', onPress: () => router.back() },
    ]);
  }

  if (!dbQuestions || questions.length === 0) {
    return (
      <View style={styles.loading}>
        <Text style={{ fontSize: 32 }}>🎯</Text>
        <Text style={styles.loadingText}>Loading quiz...</Text>
      </View>
    );
  }

  const q = questions[currentIndex];
  const progressPct = (currentIndex / questions.length) * 100;
  const isLastQuestion = currentIndex >= questions.length - 1;
  const LETTERS = ['A', 'B', 'C', 'D'];

  // Calculate final score for display
  const finalScore = answered && isCorrect ? score : score;

  return (
    <View style={styles.page}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.closeBtn} onPress={confirmExit}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${progressPct}%` as any }]} />
        </View>
        <Text style={styles.counterText}>{currentIndex + 1}/{questions.length}</Text>
      </View>

      {/* Question */}
      <Animated.View style={[styles.questionSection, { opacity: questionFade }]}>
        <View style={styles.questionBadge}>
          <Text style={styles.questionBadgeText}>Question {currentIndex + 1}</Text>
        </View>
        <Text style={styles.questionText}>{q.question}</Text>

        {/* Options */}
        <View style={styles.optionsList}>
          {shuffledOptions.map((opt, idx) => {
            const state = optionStates[idx];
            return (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.optionBtn,
                  state === 'correct' && styles.optionCorrect,
                  state === 'wrong' && styles.optionWrong,
                  state === 'dimmed' && styles.optionDimmed,
                ]}
                onPress={() => selectOption(idx)}
                disabled={answered}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.optionLetter,
                  state === 'correct' && styles.optionLetterCorrect,
                  state === 'wrong' && styles.optionLetterWrong,
                ]}>
                  <Text style={[styles.optionLetterText, (state === 'correct' || state === 'wrong') && { color: '#fff' }]}>
                    {LETTERS[idx]}
                  </Text>
                </View>
                <Text style={[styles.optionText, state === 'correct' && { color: '#166534' }, state === 'wrong' && { color: '#991b1b' }]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>

      {/* Feedback Bar */}
      <Animated.View
        style={[styles.feedbackBar, { transform: [{ translateY: feedbackTranslate }] }]}
        pointerEvents={feedbackVisible ? 'auto' : 'none'}
      >
        <View style={[styles.feedbackInner, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
          <View>
            <Text style={styles.feedbackTitle}>{isCorrect ? 'Correct! 🎉' : 'Wrong ❌'}</Text>
            <Text style={styles.feedbackSub}>
              {isCorrect ? 'Great job, keep going!' : `Answer: ${q.correctAnswer}`}
            </Text>
          </View>
          <TouchableOpacity style={styles.feedbackNextBtn} onPress={nextQuestion}>
            <Text style={styles.feedbackNextBtnText}>{isLastQuestion ? 'See Results →' : 'Continue →'}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F7F7F7' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F7F7', gap: 12 },
  loadingText: { fontSize: 16, color: '#6b7280', fontWeight: '600' },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16 },
  closeBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff', borderWidth: 2, borderColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { fontSize: 18, color: '#6b7280', fontWeight: '700' },
  progressBarTrack: { flex: 1, height: 10, backgroundColor: '#e5e7eb', borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#58CC02', borderRadius: 5 },
  counterText: { fontSize: 14, fontWeight: '700', color: '#6b7280' },
  questionSection: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  questionBadge: { backgroundColor: '#d4f5b0', alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginBottom: 16 },
  questionBadgeText: { fontSize: 12, fontWeight: '800', color: '#46a302', textTransform: 'uppercase', letterSpacing: 0.5 },
  questionText: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', lineHeight: 32, letterSpacing: -0.3, marginBottom: 28 },
  optionsList: { gap: 12 },
  optionBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderWidth: 2.5, borderColor: '#e5e7eb', borderRadius: 14, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1 },
  optionCorrect: { borderColor: '#22c55e', backgroundColor: '#f0fdf4' },
  optionWrong: { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
  optionDimmed: { opacity: 0.45 },
  optionLetter: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F7F7F7', justifyContent: 'center', alignItems: 'center' },
  optionLetterCorrect: { backgroundColor: '#22c55e' },
  optionLetterWrong: { backgroundColor: '#ef4444' },
  optionLetterText: { fontSize: 15, fontWeight: '800', color: '#1a1a2e' },
  optionText: { fontSize: 15.5, fontWeight: '600', color: '#1a1a2e', flex: 1, lineHeight: 22 },
  feedbackBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16 },
  feedbackInner: { borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  feedbackCorrect: { backgroundColor: '#22c55e', shadowColor: '#22c55e', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
  feedbackWrong: { backgroundColor: '#ef4444', shadowColor: '#ef4444', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
  feedbackTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  feedbackSub: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '500', marginTop: 2 },
  feedbackNextBtn: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.25)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 12 },
  feedbackNextBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
