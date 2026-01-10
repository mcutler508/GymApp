import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { useAuth } from '../context/AuthProvider';
import { useTheme } from '../context/ThemeProvider';
import { Spacing } from '../constants/theme';
import { getRetroCardStyle, getRetroButtonStyle, getRetroTextStyle } from '../utils/retroStyles';

export default function SignupScreen({ navigation }: any) {
  const { theme, mode } = useTheme();
  const { signUp } = useAuth();
  const isRetro = mode === 'retro';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
  
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
  
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
  
    setLoading(true);
    const { error } = await signUp(email.trim(), password, displayName.trim() || undefined);
    setLoading(false);
  
    if (error) {
      // Handle specific error cases
      if (error.message?.includes('confirmed') || error.message?.includes('Email not confirmed')) {
        Alert.alert(
          'Email Confirmation Required',
          'Please check your email and click the confirmation link before signing in.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Signup Failed', error.message || 'Could not create account');
      }
    } else {
      // Success - user should be automatically logged in if email confirmation is disabled
      // If confirmation is required, they'll need to check email first
      Alert.alert(
        'Success',
        'Account created successfully! You can now sign in.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    }
  };

  const retroCardStyle = getRetroCardStyle({ theme, isRetro });
  const retroButtonStyle = getRetroButtonStyle({ theme, isRetro });
  const retroTitleStyle = getRetroTextStyle({ isRetro, variant: 'heading' });

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text
            variant="headlineMedium"
            style={[
              styles.title,
              { color: theme.colors.text },
              retroTitleStyle
            ]}
          >
            Create Account
          </Text>
          <Text
            variant="bodyLarge"
            style={[styles.subtitle, { color: theme.colors.textSecondary }]}
          >
            Sign up to start tracking your workouts
          </Text>

          <Card
            style={[
              styles.card,
              { backgroundColor: theme.colors.card },
              retroCardStyle
            ]}
          >
            <Card.Content style={styles.cardContent}>
              <TextInput
                label="Display Name (Optional)"
                value={displayName}
                onChangeText={setDisplayName}
                mode="outlined"
                autoCapitalize="words"
                style={styles.input}
                textColor={theme.colors.text}
              />

              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={styles.input}
                textColor={theme.colors.text}
              />

              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry
                autoCapitalize="none"
                style={styles.input}
                textColor={theme.colors.text}
              />

              <TextInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                mode="outlined"
                secureTextEntry
                autoCapitalize="none"
                style={styles.input}
                textColor={theme.colors.text}
              />

              <Button
                mode="contained"
                onPress={handleSignup}
                loading={loading}
                disabled={loading}
                style={[styles.button, retroButtonStyle]}
                buttonColor={theme.colors.primary}
                textColor="#fff"
                labelStyle={isRetro ? { fontWeight: '700', fontSize: 15 } : {}}
              >
                Sign Up
              </Button>

              <Button
                mode="text"
                onPress={() => navigation.navigate('Login')}
                style={styles.linkButton}
                textColor={theme.colors.primary}
              >
                Already have an account? Sign in
              </Button>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  card: {
    marginTop: Spacing.md,
  },
  cardContent: {
    padding: Spacing.md,
  },
  input: {
    marginBottom: Spacing.md,
  },
  button: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  linkButton: {
    marginTop: Spacing.xs,
  },
});