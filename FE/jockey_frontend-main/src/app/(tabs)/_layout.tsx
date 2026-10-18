import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/navigation/tab-bar';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="races" />
      <Tabs.Screen name="live" />
      <Tabs.Screen name="results" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
