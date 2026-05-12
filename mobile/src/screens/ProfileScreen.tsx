import { StyleSheet, View } from 'react-native';
import { Avatar, Button, Card, Divider, Text } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { AppTabsScreenProps } from '../navigation/types';

export function ProfileScreen(_props: AppTabsScreenProps<'Profile'>) {
  const { user, signOut } = useAuth();

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0].toUpperCase() ?? '?';

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Avatar.Text size={72} label={initials} style={styles.avatar} />
          <Text variant="titleLarge" style={styles.name}>
            {user?.user_metadata?.full_name ?? 'Usuario'}
          </Text>
          <Text variant="bodyMedium" style={styles.email}>{user?.email}</Text>
          <View style={styles.planBadge}>
            <Text variant="labelMedium" style={styles.planText}>Plan Free</Text>
          </View>
        </Card.Content>
      </Card>

      <Divider style={styles.divider} />

      <Button
        mode="outlined"
        icon="crown"
        style={styles.upgradeButton}
        textColor={colors.accent}
      >
        Actualizar a Premium
      </Button>

      <Button
        mode="outlined"
        icon="logout"
        onPress={signOut}
        style={styles.logoutButton}
        textColor={colors.error}
      >
        Cerrar sesión
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: colors.background },
  card: { marginBottom: 24, backgroundColor: colors.surface },
  cardContent: { alignItems: 'center', gap: 8, paddingVertical: 24 },
  avatar: { backgroundColor: colors.primary },
  name: { color: colors.textPrimary, fontWeight: 'bold' },
  email: { color: colors.textSecondary },
  planBadge: {
    backgroundColor: colors.primaryLight + '22',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  planText: { color: colors.primary },
  divider: { marginBottom: 24 },
  upgradeButton: { marginBottom: 12, borderColor: colors.accent },
  logoutButton: { borderColor: colors.error },
});
