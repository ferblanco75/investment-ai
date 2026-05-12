import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { Button, HelperText, Snackbar, Text, TextInput } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { AuthStackScreenProps } from '../navigation/types';

type FormData = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export function RegisterScreen({ navigation }: AuthStackScreenProps<'Register'>) {
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });

  const passwordValue = watch('password');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      await signUp(data.email.trim().toLowerCase(), data.password, data.fullName.trim());
      setSuccess(true);
    } catch (e: any) {
      setError(e.message ?? 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <KeyboardAvoidingView style={styles.container}>
        <ScrollView contentContainerStyle={styles.inner}>
          <Text variant="headlineSmall" style={styles.successTitle}>¡Registración exitosa! 🎉</Text>
          <Text variant="bodyMedium" style={styles.successText}>
            Te enviamos un email de confirmación. Revisá tu bandeja de entrada y hacé click en el enlace para activar tu cuenta.
          </Text>
          <Button mode="contained" onPress={() => navigation.navigate('Login')} style={styles.button}>
            Ir al login
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text variant="headlineSmall" style={styles.title}>Crear cuenta</Text>

        <Controller
          control={control}
          name="fullName"
          rules={{ required: 'El nombre es requerido' }}
          render={({ field: { onChange, value } }) => (
            <>
              <TextInput
                label="Nombre completo"
                mode="outlined"
                value={value}
                onChangeText={onChange}
                autoCapitalize="words"
                autoComplete="name"
                left={<TextInput.Icon icon="account" />}
                error={!!errors.fullName}
              />
              <HelperText type="error" visible={!!errors.fullName}>
                {errors.fullName?.message}
              </HelperText>
            </>
          )}
        />

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
          rules={{
            required: 'La contraseña es requerida',
            minLength: { value: 6, message: 'Mínimo 6 caracteres' },
          }}
          render={({ field: { onChange, value } }) => (
            <>
              <TextInput
                label="Contraseña"
                mode="outlined"
                value={value}
                onChangeText={onChange}
                secureTextEntry={!showPassword}
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

        <Controller
          control={control}
          name="confirmPassword"
          rules={{
            required: 'Confirmá tu contraseña',
            validate: v => v === passwordValue || 'Las contraseñas no coinciden',
          }}
          render={({ field: { onChange, value } }) => (
            <>
              <TextInput
                label="Confirmar contraseña"
                mode="outlined"
                value={value}
                onChangeText={onChange}
                secureTextEntry={!showPassword}
                left={<TextInput.Icon icon="lock-check" />}
                error={!!errors.confirmPassword}
              />
              <HelperText type="error" visible={!!errors.confirmPassword}>
                {errors.confirmPassword?.message}
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
          Crear cuenta
        </Button>

        <Button mode="text" onPress={() => navigation.goBack()} disabled={loading}>
          ¿Ya tenés cuenta? Iniciá sesión
        </Button>
      </ScrollView>

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
  inner: { padding: 24, gap: 4 },
  title: { color: colors.primary, fontWeight: 'bold', marginBottom: 16 },
  button: { marginTop: 16, borderRadius: 8 },
  buttonContent: { paddingVertical: 6 },
  snackbar: { backgroundColor: colors.error },
  successTitle: { color: colors.success, fontWeight: 'bold', marginBottom: 16 },
  successText: { color: colors.textSecondary, marginBottom: 24, lineHeight: 22 },
});
