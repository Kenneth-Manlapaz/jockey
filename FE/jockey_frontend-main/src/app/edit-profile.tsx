import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppBar, Button, Screen, TextField } from '@/components/ui';
import { useAuthUser, useSessionStore } from '@/lib/auth/session';

export default function EditProfileScreen() {
  const router = useRouter();
  const user = useAuthUser();
  const updateUser = useSessionStore((state) => state.updateUser);

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [mobile, setMobile] = useState(user?.mobile ?? '');

  const onSave = () => {
    updateUser({ firstName, lastName, email, mobile });
    router.back();
  };

  return (
    <Screen>
      <AppBar title="Edit Profile" fallbackHref="/profile" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ padding: 20, gap: 14 }}
          keyboardShouldPersistTaps="handled"
        >
          <TextField
            label="First name"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First name"
          />
          <TextField
            label="Last name"
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last name"
          />
          <TextField
            label="Email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="name@example.com"
          />
          <TextField
            label="Mobile number"
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
            placeholder="+63 917 123 4567"
          />
          <View className="pt-2">
            <Button label="Save changes" onPress={onSave} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
