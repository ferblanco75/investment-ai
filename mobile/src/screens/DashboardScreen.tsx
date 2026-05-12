import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { AppTabsScreenProps } from '../navigation/types';

export function DashboardScreen(_props: AppTabsScreenProps<'Dashboard'>) {
  return (
    <View style={styles.container}>
      <Ionicons name="bar-chart-outline" size={64} color={colors.border} />
      <Text variant="titleLarge" style={styles.title}>Portfolio</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Próximamente podrás ver y gestionar tus inversiones aquí.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32, backgroundColor: colors.background },
  title: { color: colors.textPrimary, fontWeight: 'bold' },
  subtitle: { color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
