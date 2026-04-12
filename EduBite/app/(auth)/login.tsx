import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Animated, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { router, Link } from 'expo-router';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { saveSession } from '@/lib/session';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const loginUser = useMutation(api.users.loginUser);

  function shake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: -8, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -4, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  async function handleLogin() {
    setError('');
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setError('Please fill in all fields.');
      shake();
      return;
    }

    setLoading(true);
    try {
      const session = await loginUser({ email: trimmedEmail, password });
      await saveSession({ userId: session.userId, email: session.email });
      router.replace('/(tabs)/home');
    } catch (e: any) {
      setError(e.message || 'Invalid email or password.');
      shake();
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoEmoji}>🧠</Text>
          </View>
          <Text style={styles.title}>Welcome back!</Text>
          <Text style={styles.subtitle}>Sign in to continue learning</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Error */}
          {error ? (
            <Animated.View style={[styles.errorBox, { transform: [{ translateX: shakeAnim }] }]}>
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          ) : null}

          {/* Email */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              onSubmitEditing={handleLogin}
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Demo hint */}
        <View style={styles.demoHint}>
          <Text style={styles.demoLabel}>DEMO ACCOUNT</Text>
          <Text style={styles.demoText}>test@edubite.com  /  123456</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F7F7F7' },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40 },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 40 },
  logoIcon: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: '#58CC02', justifyContent: 'center', alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#58CC02', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8,
  },
  logoEmoji: { fontSize: 40 },
  title: { fontSize: 26, fontWeight: '800', color: '#1a1a2e', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#6b7280', marginTop: 8, fontWeight: '500' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4 },
  errorBox: { backgroundColor: '#fef2f2', padding: 12, borderRadius: 10, marginBottom: 16 },
  errorText: { color: '#ef4444', fontSize: 14, fontWeight: '600' },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '700', color: '#1a1a2e', marginBottom: 8, letterSpacing: 0.5 },
  input: {
    borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 12,
    padding: 14, fontSize: 16, color: '#1a1a2e', backgroundColor: '#F7F7F7',
  },
  btn: {
    backgroundColor: '#58CC02', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 8,
    shadowColor: '#58CC02', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  footerText: { fontSize: 15, color: '#6b7280' },
  footerLink: { fontSize: 15, color: '#46a302', fontWeight: '700' },
  demoHint: { backgroundColor: '#d4f5b0', borderRadius: 12, padding: 16, marginTop: 24, alignItems: 'center' },
  demoLabel: { fontSize: 11, fontWeight: '800', color: '#46a302', letterSpacing: 1, marginBottom: 4 },
  demoText: { fontSize: 13, color: '#46a302', fontWeight: '600' },
});
