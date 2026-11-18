import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import {
  Avatar,
  Button,
  Card,
  HelperText,
  Text,
  TextInput,
} from 'react-native-paper';
import { APP_COLORS } from '../../theme/paperTheme';
import type { UserProfile } from '../../types/matka';

interface ProfileScreenProps {
  profile: UserProfile;
  onUpdateProfile: (next: UserProfile) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  profile,
  onUpdateProfile,
}) => {
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [email, setEmail] = useState(profile.email);
  const [errorText, setErrorText] = useState<string | null>(null);

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('') || 'RC';

  const handleSave = (): void => {
    if (!name.trim() || phone.trim().length < 10) {
      setErrorText('Enter a valid name and 10-digit contact number.');
      return;
    }
    onUpdateProfile({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
    });
    setErrorText(null);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <Avatar.Text
        size={74}
        label={initials}
        style={styles.avatar}
        labelStyle={styles.avatarLabel}
      />
      <Text variant="titleMedium" style={styles.nameHeading}>
        {profile.name}
      </Text>
      <Text variant="bodySmall" style={styles.phoneSub}>
        {profile.phone}
      </Text>

      <Card style={styles.card} mode="contained">
        <Card.Content>
          <TextInput
            mode="outlined"
            label="Full Name"
            value={name}
            onChangeText={val => {
              setName(val);
              setErrorText(null);
            }}
            style={styles.input}
            outlineColor={APP_COLORS.border}
            activeOutlineColor={APP_COLORS.accent}
          />
          <TextInput
            mode="outlined"
            label="Mobile Number"
            value={phone}
            onChangeText={val => {
              setPhone(val.replace(/\D/g, ''));
              setErrorText(null);
            }}
            keyboardType="phone-pad"
            maxLength={10}
            style={styles.input}
            outlineColor={APP_COLORS.border}
            activeOutlineColor={APP_COLORS.accent}
          />
          <TextInput
            mode="outlined"
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            style={styles.input}
            outlineColor={APP_COLORS.border}
            activeOutlineColor={APP_COLORS.accent}
          />

          {errorText && (
            <HelperText type="error" visible={Boolean(errorText)}>
              {errorText}
            </HelperText>
          )}

          <Button
            mode="contained"
            onPress={handleSave}
            buttonColor={APP_COLORS.accent}
            textColor={APP_COLORS.onAccent}
            style={styles.saveBtn}
            labelStyle={styles.saveLabel}>
            Save Profile
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.primaryBackground,
  },
  content: {
    padding: 16,
    paddingTop: 22,
    paddingBottom: 28,
  },
  avatar: {
    alignSelf: 'center',
    backgroundColor: APP_COLORS.accent,
    marginBottom: 10,
  },
  avatarLabel: {
    color: APP_COLORS.primaryBackground,
    fontWeight: '800',
  },
  nameHeading: {
    color: APP_COLORS.textPrimary,
    fontWeight: '800',
    textAlign: 'center',
  },
  phoneSub: {
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 18,
  },
  card: {
    backgroundColor: APP_COLORS.secondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  input: {
    backgroundColor: APP_COLORS.primaryBackground,
    marginBottom: 12,
  },
  saveBtn: {
    borderRadius: 12,
    marginTop: 4,
    paddingVertical: 4,
  },
  saveLabel: {
    fontWeight: '800',
  },
});
