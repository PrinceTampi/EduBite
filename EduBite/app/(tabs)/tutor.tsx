import { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList,
  KeyboardAvoidingView, Platform, Modal, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { getSession, getGeminiKey, saveGeminiKey, clearGeminiKey, Session } from '@/lib/session';
import { Id } from '@/convex/_generated/dataModel';

const SMART_RESPONSES: Record<string, string> = {
  'solar system': '🌍 **The Solar System** is our cosmic neighborhood! It has **8 planets** orbiting the Sun.\n\nThe inner planets (Mercury, Venus, Earth, Mars) are rocky, while the outer planets (Jupiter, Saturn, Uranus, Neptune) are gas and ice giants.\n\n**Fun fact:** If the Sun were a basketball, Earth would be the size of a small pea about 26 meters away! 🏀',
  'photosynthesis': '🌿 **Photosynthesis** is how plants make their own food!\n\nThe recipe:\n- **Ingredients:** Sunlight + Water + CO₂\n- **Output:** Glucose + Oxygen\n\nThis happens in **chloroplasts** using **chlorophyll** — that\'s why leaves are green! 🍃',
  'dna': '🧬 **DNA** is the instruction manual for building you!\n\nImagine a twisted ladder (double helix) where each rung is a base pair: **A-T** and **C-G**.\n\nYour DNA would stretch to the Sun and back ~600 times if uncoiled!',
  'water cycle': '💧 **The Water Cycle** — Earth\'s way of recycling water!\n\n1. **Evaporation** — Sun heats water into vapor\n2. **Condensation** — Vapor cools into clouds\n3. **Precipitation** — Rain/snow falls\n4. **Collection** — Water in rivers/oceans\n\nThen it repeats! ♻️',
  'electricity': '⚡ **Electricity** is the flow of **electrons** through a conductor.\n\nThink of it like water through a pipe:\n- **Voltage** = pressure\n- **Current** = flow rate\n- **Resistance** = pipe thickness\n\n**Ohm\'s Law:** V = I × R',
  'internet': '🌐 **The Internet** connects computers worldwide!\n\nWhen you visit a website:\n1. Your device asks a **DNS server** for the IP address\n2. Request travels through **routers**\n3. Server sends back data in **packets**\n4. Browser reassembles and displays it\n\nAll in milliseconds! ⚡',
  'html': '🖥️ **HTML & CSS** = the building blocks of every website!\n\n**HTML** = skeleton (structure)\n**CSS** = clothing (style)\n\nTogether they create everything you see on the web! 🎨',
  'python': '🐍 **Python** — one of the easiest languages to learn!\n\n- Reads almost like English\n- Used in AI, web dev, data science\n- Named after Monty Python, not the snake! 😄\n\n`print("Hello, World!")` — your first program!',
  'cybersecurity': '🔐 **Cybersecurity** — protecting your digital life.\n\n**Top 5 tips:**\n1. Use strong, unique passwords\n2. Enable **2FA**\n3. Avoid suspicious links\n4. Keep software updated\n5. Use **VPN** on public Wi-Fi',
  'database': '🗄️ **Databases** — super-powered spreadsheets!\n\n- **SQL** (Relational): Tables with rows & columns\n- **NoSQL**: Flexible formats like JSON\n\n`SELECT * FROM students WHERE grade = "A"` — finds all A students!',
  'cloud': '☁️ **Cloud Computing** = using someone else\'s computers over the internet!\n\n- **IaaS** — Virtual machines (AWS)\n- **PaaS** — Build platforms (Heroku)\n- **SaaS** — Ready apps (Gmail)\n\nThe "cloud" is actually huge data centers! 🏢',
  'api': '🔌 **APIs** = waiters in a restaurant!\n\nYou (app) → waiter (API) → kitchen (server) → food (data)\n\n**HTTP Methods:** GET, POST, PUT, DELETE\n\nAPIs return data in **JSON** format! 🤝',
  'coral': '🐠 **Coral Reefs** — Rainforests of the Sea!\n\nThey cover < 1% of the ocean but support **25% of marine species**.\n\nCoral **bleaching** happens when warming water causes corals to expel their algae. 🌡️',
  'volcano': '🌋 **Volcanoes** — Earth\'s pressure release valves!\n\n**3 types:** Shield, Stratovolcano, Cinder Cone\n\nMost sit along the **Ring of Fire** — a 40,000 km zone around the Pacific! 🔥',
  'rainforest': '🌴 **Rainforests** — Earth\'s most biodiverse ecosystems!\n\n**4 layers:** Emergent, Canopy, Understory, Forest Floor\n\nThey cover 6% of Earth but house **50%+ of all species**! 🌿',
  'japanese': '🇯🇵 **Japanese** uses 3 writing systems!\n\n- **Hiragana** — native words\n- **Katakana** — foreign words\n- **Kanji** — ~2,000 characters\n\nYou need all 3 to read a newspaper! 📰',
  'spanish': '🇪🇸 **Spanish** — second most spoken native language!\n\n- Hola = Hello\n- Gracias = Thank you\n- ¿Cómo estás? = How are you?\n\n480M+ native speakers across 20+ countries! 🌎',
};

function getSmartResponse(msg: string): string {
  const lower = msg.toLowerCase();
  for (const [key, reply] of Object.entries(SMART_RESPONSES)) {
    if (lower.includes(key)) return reply;
  }
  if (lower.includes('quiz') || lower.includes('test me')) {
    return '🎯 **Quick Quiz!**\n\nWhich is NOT a programming language?\n\nA) Python\nB) Java\nC) HTML\nD) Ruby\n\nType A, B, C, or D!';
  }
  if (lower === 'c') return '🎉 **Correct!** HTML is a markup language, not a programming language! It can\'t do logic or loops.\n\nWant another question? 🧠';
  if (lower === 'a' || lower === 'b' || lower === 'd') return '❌ **Not quite!** The answer is **C) HTML**.\n\nHTML structures web content but can\'t perform logic. Python, Java, and Ruby can!\n\nWant to try another? 💪';
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return '👋 Hey there! I\'m your AI tutor!\n\nAsk me about **Science**, **Technology**, **Language**, or **Nature**! 🚀';
  }
  if (lower.includes('thank')) return '😊 You\'re welcome! Keep learning — every question makes you smarter! 🧠✨';
  if (lower.includes('help') || lower.includes('what can you')) {
    return '👋 I can help with:\n\n📖 Explain lesson topics\n🧪 Answer science questions\n💻 IT & coding concepts\n🌍 Language basics\n🌿 Nature topics\n🎯 Quiz you on what you know\n\nJust ask! 😊';
  }
  return '🤔 That\'s interesting!\n\nI work best with topics from your lessons. Try asking about **Science**, **Technology**, **Language**, or **Nature**.\n\n💡 **Tip:** Add your free Gemini API key in settings ⚙️ for unlimited AI responses!';
}

async function callGeminiAPI(message: string, apiKey: string, history: Array<{role: string; content: string}>): Promise<string> {
  const systemPrompt = `You are "EduBite AI", a friendly and encouraging AI tutor for a microlearning app. You help students understand topics across Science, IT/Technology, Language, and Nature.

Your teaching style:
- Use simple, clear explanations suitable for beginners
- Include real-world examples and analogies
- Use emojis occasionally to keep it engaging
- Keep responses concise (2-4 paragraphs max)
- If asked to quiz, create 1-2 multiple choice questions
- Encourage the student and celebrate their curiosity`;

  const contents = [
    ...history.slice(-6).map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }],
    })),
    { role: 'user', parts: [{ text: message }] },
  ];

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error?.message || 'API request failed');
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "I didn't get a response. Try asking differently!";
}

interface ChatMessage {
  role: string;
  content: string;
  _id?: string;
}

export default function TutorScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [apiModal, setApiModal] = useState(false);
  const [geminiKey, setGeminiKey] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const flatListRef = useRef<FlatList>(null);

  const dbHistory = useQuery(
    api.chat.getChatHistory,
    session?.userId ? { userId: session.userId as Id<'users'> } : 'skip'
  );
  const saveMessage = useMutation(api.chat.saveMessage);
  const clearHistory = useMutation(api.chat.clearChatHistory);

  useEffect(() => {
    getSession().then((s) => {
      if (!s) { router.replace('/(auth)/login'); return; }
      setSession(s);
    });
    getGeminiKey().then(setGeminiKey);
  }, []);

  useEffect(() => {
    if (dbHistory && dbHistory.length > 0) {
      setLocalMessages(dbHistory.map(m => ({ role: m.role, content: m.content, _id: m._id })));
      setShowWelcome(false);
    }
  }, [dbHistory]);

  async function sendMessage(text?: string) {
    const msg = (text ?? inputText).trim();
    if (!msg || isGenerating || !session) return;

    setInputText('');
    setIsGenerating(true);
    setShowWelcome(false);

    const userMsg: ChatMessage = { role: 'user', content: msg };
    setLocalMessages(prev => [...prev, userMsg]);

    // Save to DB
    await saveMessage({ userId: session.userId as Id<'users'>, role: 'user', content: msg });

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      let response: string;
      if (geminiKey) {
        response = await callGeminiAPI(msg, geminiKey, localMessages);
      } else {
        await new Promise(r => setTimeout(r, 800 + Math.random() * 800));
        response = getSmartResponse(msg);
      }

      const aiMsg: ChatMessage = { role: 'ai', content: response };
      setLocalMessages(prev => [...prev, aiMsg]);
      await saveMessage({ userId: session.userId as Id<'users'>, role: 'ai', content: response });
    } catch (e: any) {
      const errMsg: ChatMessage = { role: 'ai', content: 'Sorry, I had trouble with that. Please check your API key in settings ⚙️ and try again!' };
      setLocalMessages(prev => [...prev, errMsg]);
    }

    setIsGenerating(false);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
  }

  async function handleSaveApiKey() {
    if (apiKeyInput.trim()) {
      await saveGeminiKey(apiKeyInput.trim());
      setGeminiKey(apiKeyInput.trim());
    } else {
      await clearGeminiKey();
      setGeminiKey('');
    }
    setApiModal(false);
  }

  async function handleClearHistory() {
    if (!session) return;
    Alert.alert('Clear Chat', 'Are you sure you want to clear the chat history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive', onPress: async () => {
          await clearHistory({ userId: session.userId as Id<'users'> });
          setLocalMessages([]);
          setShowWelcome(true);
        }
      },
    ]);
  }

  const QUICK_QUESTIONS = [
    { icon: '💡', text: 'Explain photosynthesis in simple words' },
    { icon: '🧪', text: "What's the difference between DNA and RNA?" },
    { icon: '🌐', text: 'How does the internet actually work?' },
    { icon: '🔐', text: 'Give me tips to stay safe online' },
  ];

  const TOPIC_CHIPS = [
    { icon: '🔬', label: 'Science', msg: 'I want to learn about Science topics. What can you teach me?' },
    { icon: '💻', label: 'IT', msg: 'Tell me about Technology and IT concepts.' },
    { icon: '🌍', label: 'Language', msg: "I'm interested in Language topics. Can you help?" },
    { icon: '🌿', label: 'Nature', msg: 'Teach me about Nature and the environment.' },
  ];

  function renderMessage({ item, index }: { item: ChatMessage; index: number }) {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAi]}>
        <View style={[styles.msgAvatar, isUser ? styles.msgAvatarUser : styles.msgAvatarAi]}>
          <Text style={{ fontSize: 16 }}>{isUser ? '👤' : '🤖'}</Text>
        </View>
        <View style={[styles.msgBubble, isUser ? styles.msgBubbleUser : styles.msgBubbleAi]}>
          <Text style={[styles.msgText, isUser && styles.msgTextUser]}>{item.content}</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.tutorAvatarWrap}>
          <Text style={{ fontSize: 22 }}>🤖</Text>
        </View>
        <View style={styles.tutorInfo}>
          <Text style={styles.tutorName}>EduBite AI</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>
              {geminiKey ? 'Gemini AI Connected' : 'Smart Mode Active'}
            </Text>
          </View>
        </View>
        <View style={styles.topActions}>
          {localMessages.length > 0 && (
            <TouchableOpacity style={styles.actionBtn} onPress={handleClearHistory}>
              <Text style={{ fontSize: 16 }}>🗑️</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionBtn} onPress={() => { setApiKeyInput(geminiKey); setApiModal(true); }}>
            <Text style={{ fontSize: 18 }}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat Area */}
      {showWelcome ? (
        <FlatList
          ref={flatListRef}
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={
            <View style={styles.welcomeContainer}>
              <View style={styles.welcomeSection}>
                <Text style={{ fontSize: 56, marginBottom: 12 }}>🧠</Text>
                <Text style={styles.welcomeTitle}>Hi, I'm your AI Tutor!</Text>
                <Text style={styles.welcomeSub}>Ask me anything about your lessons. I'll explain concepts, quiz you, or help you understand tricky topics.</Text>
              </View>

              <Text style={styles.chipsLabel}>PICK A TOPIC</Text>
              <View style={styles.chipsRow}>
                {TOPIC_CHIPS.map(chip => (
                  <TouchableOpacity key={chip.label} style={styles.chip} onPress={() => sendMessage(chip.msg)}>
                    <Text style={{ fontSize: 16 }}>{chip.icon}</Text>
                    <Text style={styles.chipText}>{chip.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.chipsLabel}>TRY ASKING</Text>
              {QUICK_QUESTIONS.map(q => (
                <TouchableOpacity key={q.text} style={styles.quickBtn} onPress={() => sendMessage(q.text)}>
                  <Text style={{ fontSize: 20 }}>{q.icon}</Text>
                  <Text style={styles.quickBtnText}>{q.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          }
          contentContainerStyle={styles.chatContent}
        />
      ) : (
        <FlatList
          ref={flatListRef}
          data={localMessages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListFooterComponent={
            isGenerating ? (
              <View style={[styles.msgRow, styles.msgRowAi]}>
                <View style={[styles.msgAvatar, styles.msgAvatarAi]}>
                  <Text style={{ fontSize: 16 }}>🤖</Text>
                </View>
                <View style={styles.typingBubble}>
                  <ActivityIndicator size="small" color="#6b7280" />
                </View>
              </View>
            ) : null
          }
        />
      )}

      {/* Input */}
      <View style={styles.inputArea}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.chatInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask your AI tutor..."
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || isGenerating) && styles.sendBtnDisabled]}
            onPress={() => sendMessage()}
            disabled={!inputText.trim() || isGenerating}
          >
            <Text style={{ color: '#fff', fontSize: 16 }}>➤</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* API Key Modal */}
      <Modal visible={apiModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalIcon}>🔑</Text>
            <Text style={styles.modalTitle}>Connect AI</Text>
            <Text style={styles.modalSub}>Add your Gemini API key for unlimited AI responses. Without a key, you get smart built-in responses.</Text>

            <View style={[styles.statusBadge, geminiKey ? styles.statusConnected : styles.statusDisconnected]}>
              <Text style={styles.statusBadgeText}>{geminiKey ? '✅ API key connected' : '⚪ No key — smart mode'}</Text>
            </View>

            <Text style={styles.modalLabel}>GEMINI API KEY</Text>
            <TextInput
              style={styles.modalInput}
              value={apiKeyInput}
              onChangeText={setApiKeyInput}
              placeholder="AIzaSy..."
              placeholderTextColor="#9ca3af"
              secureTextEntry
              autoCapitalize="none"
            />
            <Text style={styles.modalHint}>Get a free key at aistudio.google.com/apikey</Text>

            <TouchableOpacity style={styles.modalPrimaryBtn} onPress={handleSaveApiKey}>
              <Text style={styles.modalPrimaryBtnText}>Save API Key</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setApiModal(false)}>
              <Text style={styles.modalSecondaryBtn}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F7F7F7' },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tutorAvatarWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center', shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  tutorInfo: { flex: 1 },
  tutorName: { fontSize: 17, fontWeight: '800', color: '#1a1a2e' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#58CC02' },
  statusText: { fontSize: 12, color: '#46a302', fontWeight: '600' },
  topActions: { flexDirection: 'row', gap: 6 },
  actionBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F7F7F7', justifyContent: 'center', alignItems: 'center' },
  chatContent: { padding: 16, gap: 16, flexGrow: 1 },
  welcomeContainer: { padding: 4 },
  welcomeSection: { alignItems: 'center', paddingVertical: 24 },
  welcomeTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', marginBottom: 8 },
  welcomeSub: { fontSize: 14, color: '#6b7280', fontWeight: '500', textAlign: 'center', lineHeight: 22 },
  chipsLabel: { fontSize: 11, fontWeight: '700', color: '#6b7280', letterSpacing: 0.5, marginBottom: 10, marginTop: 16 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 24 },
  chipText: { fontSize: 13, fontWeight: '600', color: '#1a1a2e' },
  quickBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: '#fff', borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 14, marginBottom: 8 },
  quickBtnText: { fontSize: 14, fontWeight: '600', color: '#1a1a2e', flex: 1 },
  msgRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  msgRowUser: { flexDirection: 'row-reverse' },
  msgRowAi: { flexDirection: 'row' },
  msgAvatar: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 2, flexShrink: 0 },
  msgAvatarUser: { backgroundColor: '#58CC02' },
  msgAvatarAi: { backgroundColor: '#6366f1' },
  msgBubble: { maxWidth: '82%', padding: 14, borderRadius: 18 },
  msgBubbleUser: { backgroundColor: '#6366f1', borderBottomRightRadius: 4, shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  msgBubbleAi: { backgroundColor: '#fff', borderBottomLeftRadius: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  msgText: { fontSize: 14.5, lineHeight: 22, color: '#1a1a2e' },
  msgTextUser: { color: '#fff' },
  typingBubble: { backgroundColor: '#fff', padding: 16, borderRadius: 18, borderBottomLeftRadius: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  inputArea: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb', padding: 12 },
  inputWrapper: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, backgroundColor: '#F7F7F7', borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6 },
  chatInput: { flex: 1, fontSize: 15, color: '#1a1a2e', maxHeight: 100, paddingVertical: 10, lineHeight: 22 },
  sendBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center', shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  sendBtnDisabled: { opacity: 0.4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { backgroundColor: '#fff', borderRadius: 24, padding: 28, width: '100%', maxWidth: 360 },
  modalIcon: { fontSize: 48, textAlign: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a2e', textAlign: 'center', marginBottom: 8 },
  modalSub: { fontSize: 13, color: '#6b7280', fontWeight: '500', lineHeight: 20, textAlign: 'center', marginBottom: 16 },
  statusBadge: { padding: 10, borderRadius: 10, marginBottom: 16 },
  statusConnected: { backgroundColor: '#f0fdf4' },
  statusDisconnected: { backgroundColor: '#f9fafb' },
  statusBadgeText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  modalLabel: { fontSize: 12, fontWeight: '700', color: '#1a1a2e', marginBottom: 8, letterSpacing: 0.5 },
  modalInput: { borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, fontSize: 14, color: '#1a1a2e', backgroundColor: '#F7F7F7', marginBottom: 8 },
  modalHint: { fontSize: 12, color: '#6b7280', marginBottom: 20 },
  modalPrimaryBtn: { backgroundColor: '#6366f1', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 10 },
  modalPrimaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  modalSecondaryBtn: { fontSize: 14, fontWeight: '600', color: '#6b7280', textAlign: 'center', paddingVertical: 8 },
});
