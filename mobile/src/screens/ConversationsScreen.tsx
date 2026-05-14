import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Divider, FAB, IconButton, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { colors } from '../theme/colors';
import { ChatStackScreenProps } from '../navigation/types';

interface Conversation {
  id: string;
  title: string | null;
  updated_at: string;
  message_count?: number;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

export function ConversationsScreen({ navigation }: ChatStackScreenProps<'ConversationsList'>) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('conversations')
      .select('id, title, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(50);
    setConversations(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Recargar al volver de una conversación
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadConversations);
    return unsubscribe;
  }, [navigation, loadConversations]);

  const createNewConversation = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('conversations')
      .insert({ user_id: user.id, title: null })
      .select('id')
      .single();
    if (data) {
      navigation.navigate('Chat', { conversationId: data.id, title: 'Nueva conversación' });
    }
  };

  const deleteConversation = async (id: string) => {
    setDeleting(id);
    await supabase.from('conversations').delete().eq('id', id);
    setConversations(prev => prev.filter(c => c.id !== id));
    setDeleting(null);
  };

  const renderItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate('Chat', {
        conversationId: item.id,
        title: item.title ?? 'Conversación',
      })}
      activeOpacity={0.7}
    >
      <View style={styles.itemIcon}>
        <Ionicons name="chatbubble-ellipses" size={22} color={colors.primary} />
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.title ?? 'Nueva conversación'}
        </Text>
        <Text style={styles.itemTime}>{timeAgo(item.updated_at)}</Text>
      </View>
      {deleting === item.id
        ? <ActivityIndicator size={20} color={colors.textSecondary} />
        : <IconButton
            icon="delete-outline"
            size={20}
            iconColor={colors.textSecondary}
            onPress={() => deleteConversation(item.id)}
          />
      }
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {conversations.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="chatbubble-outline" size={64} color={colors.border} />
          <Text style={styles.emptyTitle}>Sin conversaciones</Text>
          <Text style={styles.emptySubtitle}>
            Tocá el botón + para comenzar a chatear con tu asesor IA
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <Divider />}
          contentContainerStyle={styles.list}
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        color={colors.textInverse}
        onPress={createNewConversation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.background },
  loading:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list:         { paddingBottom: 80 },

  item:         { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: colors.surface, gap: 12 },
  itemIcon:     { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + '18', justifyContent: 'center', alignItems: 'center' },
  itemContent:  { flex: 1 },
  itemTitle:    { fontSize: 15, fontWeight: '500', color: colors.textPrimary },
  itemTime:     { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  empty:        { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 40 },
  emptyTitle:   { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
  emptySubtitle:{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  fab:          { position: 'absolute', right: 20, bottom: 20, backgroundColor: colors.primary },
});
