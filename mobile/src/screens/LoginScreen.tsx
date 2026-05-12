import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { Button, HelperText, Snackbar, Text, TextInput } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { AuthStackScreenProps } from '../navigation/types';

type FormData = { email: string; password: string };

export function LoginScreen({ navigation }: AuthStackScreenProps<'Login'>) {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      await signIn(data.email.trim().toLowerCase(), data.password);
    } catch (e: any) {
      setError(e.message ?? 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="displaySmall" style={styles.logo}>📈</Text>
          <Text variant="headlineMedium" style={styles.title}>Investment AI</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>Tu asesor de inversiones inteligente</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            rules={{
              required: 'El email es requerido',
              pattern: { value: /\S+@\S+\.\S+/, message: 'Email inválido' },
            }}
            render={({ field: { onChange, value } }) => (
              <>
                <TextInput
                  label="Email"
                  mode="outlined"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  left={<TextInput.Icon icon="email" />}
                  error={!!errors.email}
                />
                <HelperText type="error" visible={!!errors.email}>
                  {errors.email?.message}
                </HelperText>
              </>
            )}
          />

          <Controller
            control={control}
            name="password"
            rules={{ required: 'La contraseña es requerida', minLength: { value: 6, message: 'Mínimo 6 caracteres' } }}
            render={({ field: { onChange, value } }) => (
              <>
                <TextInput
                  label="Contraseña"
                  mode="outlined"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  left={<TextInput.Icon icon="lock" />}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowPassword(v => !v)}
                    />
                  }
                  error={!!errors.password}
                />
                <HelperText type="error" visible={!!errors.password}>
                  {errors.password?.message}
                </HelperText>
              </>
            )}
          />

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            disabled={loading}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Iniciar sesión
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate('Register')}
            disabled={loading}
            style={styles.link}
          >
            ¿No tenés cuenta? Registrate
          </Button>
        </View>
      </View>

      <Snackbar
        visible={!!error}
        onDismiss={() => setError('')}
        duration={4000}
        style={styles.snackbar}
      >
        {error}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 64, marginBottom: 8 },
  title: { color: colors.primary, fontWeight: 'bold' },
  subtitle: { color: colors.textSecondary, marginTop: 4 },
  form: { gap: 4 },
  button: { marginTop: 16, borderRadius: 8 },
  buttonContent: { paddingVertical: 6 },
  link: { marginTop: 8 },
  snackbar: { backgroundColor: colors.error },
});
