import { Tabs } from 'expo-router';
import { Chrome as Home, Ticket, Gift, User } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1A1A1A',
          borderTopWidth: 0,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#FFD700',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: {
          fontFamily: 'Montserrat-Medium',
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: 'Vé của tôi',
          tabBarIcon: ({ size, color }) => (
            <Ticket size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="offers"
        options={{
          title: 'Ưu đãi',
          tabBarIcon: ({ size, color }) => (
            <Gift size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Tài khoản',
          tabBarIcon: ({ size, color }) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}