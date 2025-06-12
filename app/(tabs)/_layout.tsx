import React from 'react';
import { Tabs } from 'expo-router';
import { Bus, Search, Ticket, User } from 'lucide-react-native';
import FloatingChatButton from '../../components/FloatingChatButton';
import { View } from 'react-native';

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#2563EB',
          tabBarInactiveTintColor: '#6B7280',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopColor: '#E5E7EB',
            borderTopWidth: 1,
            paddingTop: 8,
            paddingBottom: 8,
            height: 65,
            position: 'relative',
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Trang chủ',
            tabBarIcon: ({ size, color }) => (
              <Bus size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="routes"
          options={{
            title: 'Tuyến xe',
            tabBarIcon: ({ size, color }) => (
              <Search size={size} color={color} />
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
          name="profile"
          options={{
            title: 'Tài khoản',
            tabBarIcon: ({ size, color }) => (
              <User size={size} color={color} />
            ),
          }}
        />
      </Tabs>
      <FloatingChatButton />
    </View>
  );
}

