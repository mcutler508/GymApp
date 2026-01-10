import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { useAuth } from '../context/AuthProvider';
import { useTheme } from '../context/ThemeProvider';
import { Spacing } from '../constants/theme';
import { getRetroCardStyle, getRetroButtonStyle, getRetroTextStyle } from '../utils/retroStyles';

export default function LoginScreen({ navigation }: any) {
  const { theme, mode } = useTheme();
  const { signIn } = useAuth();
  const isRetro = mode === 'retro';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);

    if (error) {
      Alert.alert('Login Failed', error.message || 'Invalid email or password');
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
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text
            variant="headlineMedium"
            style={[
              styles.title,
              { color: theme.colors.text },
              retroTitleStyle
            ]}
          >
            Gym Tracker
          </Text>
          <Text
            variant="bodyLarge"
            style={[styles.subtitle, { color: theme.colors.textSecondary }]}
          >
            Sign in to continue
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

              <Button
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                style={[styles.button, retroButtonStyle]}
                buttonColor={theme.colors.primary}
                textColor="#fff"
                labelStyle={isRetro ? { fontWeight: '700', fontSize: 15 } : {}}
              >
                Sign In
              </Button>

              <Button
                mode="text"
                onPress={() => navigation.navigate('Signup')}
                style={styles.linkButton}
                textColor={theme.colors.primary}
              >
                Don't have an account? Sign up
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