import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GiftedChat, IMessage, Bubble, Send, InputToolbar } from 'react-native-gifted-chat';
import { ActivityIndicator, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { colors } from '../theme/colors';
import { AppTabsScreenProps } from '../navigation/types';

const BOT_USER = { _id: 'assistant', name: 'Asesor IA', avatar: '🤖' };

function toGiftedMessage(msg: { id: string; role: string; content: string; created_at: string }, userId: string): IMessage {
  return {
    _id: msg.id,
    text: msg.content,
    createdAt: new Date(msg.created_at),
    user: msg.role === 'user'
      ? { _id: userId }
      : BOT_USER,
  };
}

export function ChatScreen(_props: AppTabsScreenProps<'Chat'>) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Cargar o crear conversación activa al montar
  useEffect(() => {
    if (!user) return;
    loadOrCreateConversation();
  }, [user]);

  const loadOrCreateConversation = async () => {
    setLoadingHistory(true);
    try {
      // Buscar conversación más reciente
      const { data: conv } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', user!.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      let activeId = conv?.id;

      if (!activeId) {
        // Crear primera conversación
        const { data: newConv } = await supabase
          .from('conversations')
          .insert({ user_id: user!.id, title: 'Nueva conversación' })
          .select('id')
          .single();
        activeId = newConv?.id;
      }

      if (!activeId) return;
      setConversationId(activeId);

      // Cargar historial de mensajes
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', activeId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (msgs && msgs.length > 0) {
        setMessages(msgs.map(m => toGiftedMessage(m, user!.id)));
      } else {
        // Mensaje de bienvenida
        setMessages([{
          _id: 'welcome',
          text: '¡Hola! Soy tu asesor de inversiones con IA. Podés preguntarme sobre acciones, criptomonedas, ETFs o cualquier concepto financiero. ¿En qué te puedo ayudar?',
          createdAt: new Date(),
          user: BOT_USER,
        }]);
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  const onSend = useCallback(async (newMessages: IMessage[]) => {
    if (!user || !conversationId) return;

    const userMessage = newMessages[0];
    setMessages(prev => GiftedChat.append(prev, newMessages));
    setIsTyping(true);

    try {
      // Guardar mensaje del usuario en Supabase
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        user_id: user.id,
        role: 'user',
        content: userMessage.text,
      });

      // Llamar Edge Function de Supabase (issue #66)
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          message: userMessage.text,
          conversation_id: conversationId,
        },
      });

      if (error) throw error;

      const botReply: IMessage = {
        _id: data.message_id ?? `bot-${Date.now()}`,
        text: data.reply,
        createdAt: new Date(),
        user: BOT_USER,
      };

      setMessages(prev => GiftedChat.append(prev, [botReply]));

      // Actualizar título de conversación con el primer mensaje del usuario
      await supabase
        .from('conversations')
        .update({
          title: userMessage.text.slice(0, 60),
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

    } catch {
      const errorMsg: IMessage = {
        _id: `err-${Date.now()}`,
        text: 'No pude procesar tu consulta. Verificá tu conexión e intentá nuevamente.',
        createdAt: new Date(),
        user: BOT_USER,
      };
      setMessages(prev => GiftedChat.append(prev, [errorMsg]));
    } finally {
      setIsTyping(false);
    }
  }, [user, conversationId]);

  if (loadingHistory) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando conversación...</Text>
      </View>
    );
  }

  return (
    <GiftedChat
      messages={messages}
      onSend={onSend}
      user={{ _id: user?.id ?? '' }}
      isTyping={isTyping}
      placeholder="Preguntame sobre inversiones..."
      locale="es"
      renderBubble={props => (
        <Bubble
          {...props}
          wrapperStyle={{
            right: { backgroundColor: colors.primary },
            left: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
          }}
          textStyle={{
            right: { color: colors.textInverse },
            left: { color: colors.textPrimary },
          }}
        />
      )}
      renderSend={props => (
        <Send {...props} containerStyle={styles.sendContainer}>
          <Ionicons name="send" size={22} color={colors.primary} />
        </Send>
      )}
      renderInputToolbar={props => (
        <InputToolbar
          {...props}
          containerStyle={styles.inputToolbar}
          primaryStyle={styles.inputPrimary}
        />
      )}
      messagesContainerStyle={styles.messagesContainer}
    />
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: colors.background },
  loadingText: { color: colors.textSecondary },
  sendContainer: { justifyContent: 'center', paddingHorizontal: 12, paddingBottom: 8 },
  inputToolbar: { borderTopColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 4 },
  inputPrimary: { alignItems: 'center' },
  messagesContainer: { backgroundColor: colors.background },
});
