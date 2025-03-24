import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import HomeScreen from './app/screens/HomeScreen';
import AddTradeScreen from './app/screens/AddTradeScreen';
import TradeHistoryScreen from './app/screens/TradeHistoryScreen';
import SettingsScreen from './app/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <Tab.Navigator
                    screenOptions={({ route }) => ({
                        tabBarIcon: ({ focused, color, size }) => {
                            let iconName: keyof typeof Ionicons.glyphMap;

                            switch (route.name) {
                                case 'Home':
                                    iconName = focused ? 'home' : 'home-outline';
                                    break;
                                case 'Add Trade':
                                    iconName = focused ? 'add-circle' : 'add-circle-outline';
                                    break;
                                case 'History':
                                    iconName = focused ? 'list' : 'list-outline';
                                    break;
                                case 'Settings':
                                    iconName = focused ? 'settings' : 'settings-outline';
                                    break;
                                default:
                                    iconName = 'alert';
                            }

                            return <Ionicons name={iconName} size={size} color={color} />;
                        },
                        tabBarActiveTintColor: '#2196F3',
                        tabBarInactiveTintColor: 'gray',
                    })}>
                    <Tab.Screen name="Home" component={HomeScreen} />
                    <Tab.Screen name="Add Trade" component={AddTradeScreen} />
                    <Tab.Screen name="History" component={TradeHistoryScreen} />
                    <Tab.Screen name="Settings" component={SettingsScreen} />
                </Tab.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>
    );
} 