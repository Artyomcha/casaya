import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { useApp } from '@/state/AppState';
import { c, ICON } from '@/theme';

const QUICK_REPLIES = ['Подходит, четверг 18:00', 'Можно видео-тур?', 'Какие расходы на содержание?'];

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { messages, sendMessage } = useApp();
  const [draft, setDraft] = useState('');
  const scroll = useRef<ScrollView>(null);

  // Новое сообщение всегда должно быть видно.
  useEffect(() => {
    const timer = setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(timer);
  }, [messages.length]);

  const submit = (text: string) => {
    sendMessage(text);
    setDraft('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Icon d={ICON.chevronLeft} size={20} width={2.2} />
        </Pressable>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>CL</Text>
        </View>
        <View style={styles.headerBody}>
          <Text style={styles.headerName}>Costa Living</Text>
          <Text style={styles.headerStatus}>онлайн</Text>
        </View>
      </View>

      <ScrollView
        ref={scroll}
        style={styles.thread}
        contentContainerStyle={styles.threadContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.day}>Сегодня</Text>
        {messages.map((m) => (
          <View key={m.id} style={[styles.bubbleRow, m.mine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
            <View style={[styles.bubble, m.mine ? styles.bubbleMine : styles.bubbleTheirs]}>
              <Text style={[styles.bubbleText, { color: m.mine ? c.white : c.ink }]}>{m.text}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 12) + 10 }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quick}>
          {QUICK_REPLIES.map((q) => (
            <Pressable key={q} onPress={() => submit(q)} style={styles.quickChip}>
              <Text style={styles.quickText}>{q}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={() => submit(draft)}
            placeholder="Сообщение"
            placeholderTextColor={c.greyLight}
            returnKeyType="send"
            style={styles.input}
          />
          <Pressable onPress={() => submit(draft)} style={styles.sendBtn}>
            <Icon d={ICON.send} size={20} color={c.white} width={2} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.white },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: c.line,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: c.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: c.violet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: c.white, fontWeight: '700', fontSize: 15 },
  headerBody: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '700', color: c.ink },
  headerStatus: { fontSize: 12, fontWeight: '600', color: c.green },

  thread: { flex: 1 },
  threadContent: { padding: 16, gap: 8 },
  day: { alignSelf: 'center', fontSize: 12, color: c.greyLight, paddingVertical: 4 },

  bubbleRow: { flexDirection: 'row' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', paddingVertical: 11, paddingHorizontal: 14 },
  bubbleMine: {
    backgroundColor: c.violet,
    borderRadius: 18,
    borderBottomRightRadius: 6,
  },
  bubbleTheirs: {
    backgroundColor: c.surfaceAlt,
    borderRadius: 18,
    borderBottomLeftRadius: 6,
  },
  bubbleText: { fontSize: 15, lineHeight: 22 },

  composer: {
    backgroundColor: c.white,
    borderTopWidth: 1,
    borderTopColor: c.line,
    paddingTop: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  quick: { gap: 6, paddingRight: 8 },
  quickChip: {
    borderWidth: 1,
    borderColor: c.lineStrong,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  quickText: { fontSize: 13, color: c.ink },

  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: c.surfaceAlt,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 14,
    fontSize: 15,
    color: c.ink,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: c.violet,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
