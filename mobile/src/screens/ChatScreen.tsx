import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { colors } from '../theme/colors';
import { ChatStackScreenProps } from '../navigation/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: '¡Hola! Soy tu asesor de inversiones con IA. Podés preguntarme sobre acciones, criptomonedas, ETFs o cualquier concepto financiero. ¿En qué te puedo ayudar?',
  created_at: new Date().toISOString(),
};

export function ChatScreen({ route }: ChatStackScreenProps<'Chat'>) {
  const { conversationId } = route.params;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [conversationId]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(50);

    setMessages(msgs && msgs.length > 0 ? (msgs as ChatMessage[]) : [WELCOME]);
    setLoadingHistory(false);
  };

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || !user || isTyping) return;

    setInput('');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev.filter(m => m.id !== 'welcome'), userMsg]);
    setIsTyping(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { message: text, conversation_id: conversationId },
      });

      if (error) throw error;

      setMessages(prev => [...prev, {
        id: data.message_id ?? `bot-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        created_at: new Date().toISOString(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'No pude procesar tu consulta. Verificá tu conexión e intentá nuevamente.',
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setIsTyping(false);
    }
  }, [input, user, conversationId, isTyping]);

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowBot]}>
        {!isUser && (
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarEmoji}>🤖</Text>
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
          <Text style={isUser ? styles.textUser : styles.textBot}>{item.content}</Text>
        </View>
      </View>
    );
  };

  if (loadingHistory) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando conversación...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {isTyping && (
        <View style={styles.typingRow}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarEmoji}>🤖</Text>
          </View>
          <View style={[styles.bubble, styles.bubbleBot, styles.typingBubble]}>
            <ActivityIndicator size="small" color={colors.textSecondary} />
          </View>
        </View>
      )}

      <View style={[styles.inputBar, { paddingBottom: insets.bottom || 12 }]}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Preguntame sobre inversiones..."
          placeholderTextColor={colors.textDisabled}
          multiline
          maxLength={500}
          returnKeyType="default"
        />
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || isTyping) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!input.trim() || isTyping}
        >
          <Ionicons name="send" size={20} color={colors.textInverse} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.background },
  loading:          { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: colors.background },
  loadingText:      { color: colors.textSecondary },
  list:             { padding: 16, gap: 12 },

  messageRow:       { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  messageRowUser:   { justifyContent: 'flex-end' },
  messageRowBot:    { justifyContent: 'flex-start' },

  avatarContainer:  { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  avatarEmoji:      { fontSize: 18 },

  bubble:           { maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser:       { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleBot:        { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  typingBubble:     { paddingVertical: 12, paddingHorizontal: 16 },

  textUser:         { color: colors.textInverse, fontSize: 15, lineHeight: 21 },
  textBot:          { color: colors.textPrimary, fontSize: 15, lineHeight: 21 },

  typingRow:        { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 16, paddingBottom: 8 },

  inputBar:         { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  input:            { flex: 1, minHeight: 40, maxHeight: 120, fontSize: 15, color: colors.textPrimary, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: colors.background, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  sendButton:       { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  sendButtonDisabled: { backgroundColor: colors.border },
});
