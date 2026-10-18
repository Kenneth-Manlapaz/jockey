// The unit suites exercise the in-repo fixtures, regardless of a developer's
// local real-API setting in .env.local.
process.env.EXPO_PUBLIC_USE_MOCK_API = 'true';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
