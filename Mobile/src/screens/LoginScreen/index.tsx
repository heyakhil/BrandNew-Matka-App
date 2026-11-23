import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import logo from '../../assets/logo/logo.png';
import { GradientButton } from '../../components/atoms/GradientButton';
import { AuthField } from '../../components/molecules/AuthField';
import {
  loginPlayer, resetPlayerPassword, startPlayerPasswordReset, startPlayerRegistration,
  verifyPlayerPasswordReset, verifyPlayerRegistration,
} from '../../services/api';
import { notifyError, notifySuccess, notifyWarning } from '../../services/flashMessage';
import { APP_COLORS } from '../../theme/paperTheme';

type AuthStep = 'login' | 'register' | 'registerOtp' | 'resetPhone' | 'resetOtp' | 'resetPassword';

interface LoginScreenProps {
  onAuthenticated: (token: string) => void;
}

const validDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value && value <= new Date().toISOString().slice(0, 10);
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ onAuthenticated }) => {
  const [step, setStep] = useState<AuthStep>('login');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [busy, setBusy] = useState(false);

  const changeStep = (next: AuthStep): void => {
    setStep(next);
    setOtp('');
    setPassword('');
    setConfirmPassword('');
    setResetToken('');
    setChallengeId('');
  };

  const submit = async (): Promise<void> => {
    if (busy) return;
    const mobile = phone.trim();
    if (step !== 'registerOtp' && step !== 'resetPassword' && !/^\d{10}$/.test(mobile)) {
      notifyWarning('Enter a 10-digit mobile number.');
      return;
    }
    if (step === 'register' && name.trim().length < 2) {
      notifyWarning('Enter your name.');
      return;
    }
    if (step === 'register' && !validDate(dob.trim())) {
      notifyWarning('Enter a valid date of birth as YYYY-MM-DD.');
      return;
    }
    if (['login', 'register', 'resetPassword'].includes(step) && password.length < 8) {
      notifyWarning('Password must be at least 8 characters.');
      return;
    }
    if (['register', 'resetPassword'].includes(step) && password !== confirmPassword) {
      notifyWarning('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      if (step === 'login') {
        const session = await loginPlayer(mobile, password);
        notifySuccess('Logged in successfully.');
        onAuthenticated(session.token);
      } else if (step === 'register') {
        const result = await startPlayerRegistration({
          name: name.trim(), phone: mobile, dob: dob.trim(), password, confirmPassword,
        });
        setChallengeId(result.challengeId);
        setOtp('');
        setStep('registerOtp');
        notifySuccess('A 4-digit code was sent to your mobile.');
      } else if (step === 'registerOtp') {
        if (!/^\d{4}$/.test(otp)) throw new Error('Enter the 4-digit code.');
        const session = await verifyPlayerRegistration(challengeId, otp);
        notifySuccess('Mobile verified. Welcome to Royal Club.');
        onAuthenticated(session.token);
      } else if (step === 'resetPhone') {
        const result = await startPlayerPasswordReset(mobile);
        setChallengeId(result.challengeId);
        setOtp('');
        setStep('resetOtp');
        notifySuccess('A 4-digit code was sent to your mobile.');
      } else if (step === 'resetOtp') {
        if (!/^\d{4}$/.test(otp)) throw new Error('Enter the 4-digit code.');
        const result = await verifyPlayerPasswordReset(challengeId, otp);
        setResetToken(result.resetToken);
        setStep('resetPassword');
        notifySuccess('Mobile verified. Set your new password.');
      } else {
        await resetPlayerPassword(challengeId, resetToken, password, confirmPassword);
        changeStep('login');
        notifySuccess('Password updated. Log in with your new password.');
      }
    } catch (error) {
      notifyError(error instanceof Error ? error.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const resendCode = async (): Promise<void> => {
    if (busy) return;
    setBusy(true);
    try {
      if (step === 'registerOtp') {
        const result = await startPlayerRegistration({
          name: name.trim(), phone: phone.trim(), dob: dob.trim(), password, confirmPassword,
        });
        setChallengeId(result.challengeId);
      } else if (step === 'resetOtp') {
        const result = await startPlayerPasswordReset(phone.trim());
        setChallengeId(result.challengeId);
      }
      setOtp('');
      notifySuccess('A new code was sent.');
    } catch (error) {
      notifyError(error instanceof Error ? error.message : 'Could not resend the code.');
    } finally {
      setBusy(false);
    }
  };

  const shortLogo = step !== 'login';
  const label = step === 'login' ? 'LOGIN'
    : step === 'register' ? 'SIGN-UP'
    : step === 'registerOtp' || step === 'resetOtp' ? 'VERIFY OTP'
    : step === 'resetPhone' ? 'SEND OTP' : 'UPDATE PASSWORD';

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <View style={[styles.logoArea, shortLogo ? styles.logoAreaShort : styles.logoAreaLogin]}>
          <Image source={logo} accessibilityLabel="Royal Club logo" style={styles.logo} />
        </View>
        <View style={styles.form}>
          {step === 'register' ? (
            <AuthField label="Enter Name" value={name} onChangeText={setName} autoCapitalize="words" textContentType="name" maxLength={80} />
          ) : null}
          {['login', 'register', 'resetPhone'].includes(step) ? (
            <AuthField label="Enter Mobile" value={phone} onChangeText={setPhone} keyboardType="phone-pad" textContentType="telephoneNumber" maxLength={10} />
          ) : null}
          {step === 'register' ? (
            <AuthField label="Date of Birth" placeholder="YYYY-MM-DD" value={dob} onChangeText={setDob} maxLength={10} />
          ) : null}
          {['login', 'register', 'resetPassword'].includes(step) ? (
            <AuthField label={step === 'resetPassword' ? 'New Password' : 'Enter Password'} value={password} onChangeText={setPassword} secureTextEntry textContentType={step === 'login' ? 'password' : 'newPassword'} maxLength={128} />
          ) : null}
          {['register', 'resetPassword'].includes(step) ? (
            <AuthField label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry textContentType="newPassword" maxLength={128} />
          ) : null}
          {['registerOtp', 'resetOtp'].includes(step) ? (
            <>
              <Text style={styles.helper}>Code sent to +91 {phone}</Text>
              <AuthField label="Enter 4-digit OTP" value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={4} />
            </>
          ) : null}
          {step === 'resetPassword' ? <Text style={styles.helper}>Verified mobile: +91 {phone}</Text> : null}
          <GradientButton label={busy ? 'PLEASE WAIT…' : label} height={56} fontSize={18} disabled={busy} onPress={submit} style={styles.submit} />
          {['registerOtp', 'resetOtp'].includes(step) ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Resend OTP" disabled={busy} onPress={resendCode} style={styles.link}><Text style={styles.linkText}>Resend OTP</Text></Pressable>
          ) : null}
          {step === 'login' ? (
            <>
              <Pressable accessibilityRole="button" accessibilityLabel="Forgot password?" onPress={() => changeStep('resetPhone')} style={styles.link}><Text style={styles.linkText}>Forgot password?</Text></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Sign-Up" onPress={() => changeStep('register')} style={styles.link}><Text style={styles.linkText}>Sign-Up</Text></Pressable>
            </>
          ) : (
            <Pressable accessibilityRole="button" accessibilityLabel="Back to Login" onPress={() => changeStep('login')} style={styles.link}><Text style={styles.linkText}>Back to Login</Text></Pressable>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: APP_COLORS.primaryBackground },
  content: { flexGrow: 1, paddingHorizontal: 22, paddingBottom: 24 },
  logoArea: { alignItems: 'center', justifyContent: 'center' },
  logoAreaShort: { minHeight: 180 },
  logoAreaLogin: { minHeight: 300 },
  logo: { width: 112, height: 112, resizeMode: 'contain', borderRadius: 56 },
  form: { gap: 14 },
  submit: { marginTop: 12 },
  link: { alignSelf: 'center', paddingVertical: 7, paddingHorizontal: 20 },
  linkText: { color: APP_COLORS.textPrimary, fontSize: 20 },
  helper: { color: APP_COLORS.textSecondary, textAlign: 'center', fontSize: 15 },
});
