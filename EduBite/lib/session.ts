import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = 'edubite_session';
const GEMINI_KEY = 'edubite_gemini_key';

export interface Session {
  userId: string;
  email: string;
}

export async function saveSession(session: Session): Promise<void> {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function getSession(): Promise<Session | null> {
  const data = await AsyncStorage.getItem(SESSION_KEY);
  if (!data) return null;
  return JSON.parse(data);
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}

export async function saveGeminiKey(key: string): Promise<void> {
  await AsyncStorage.setItem(GEMINI_KEY, key);
}

export async function getGeminiKey(): Promise<string> {
  return (await AsyncStorage.getItem(GEMINI_KEY)) || '';
}

export async function clearGeminiKey(): Promise<void> {
  await AsyncStorage.removeItem(GEMINI_KEY);
}
