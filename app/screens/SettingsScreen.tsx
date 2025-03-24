import React from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import ThemedText from '../components/ThemedText';
import ThemedView from '../components/ThemedView';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthService from '../lib/auth';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await AuthService.signOut();
            router.replace('/login');
        } catch (error) {
            console.error('Error signing out:', error);
            Alert.alert('Error', 'Failed to sign out');
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
            <ScrollView style={styles.scrollView}>
                <ThemedView style={styles.header}>
                    <ThemedText style={styles.title}>Settings</ThemedText>
                </ThemedView>

                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>Account</ThemedText>
                    <TouchableOpacity style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="person-outline" size={24} color="#666" />
                            <ThemedText style={styles.settingText}>Profile</ThemedText>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#666" />
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>Preferences</ThemedText>
                    <TouchableOpacity style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="color-palette-outline" size={24} color="#666" />
                            <ThemedText style={styles.settingText}>Theme</ThemedText>
                        </View>
                        <ThemedText style={styles.settingValue}>Light</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="cash-outline" size={24} color="#666" />
                            <ThemedText style={styles.settingText}>Currency</ThemedText>
                        </View>
                        <ThemedText style={styles.settingValue}>USD</ThemedText>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>Data</ThemedText>
                    <TouchableOpacity style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="cloud-upload-outline" size={24} color="#666" />
                            <ThemedText style={styles.settingText}>Backup Data</ThemedText>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#666" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="cloud-download-outline" size={24} color="#666" />
                            <ThemedText style={styles.settingText}>Restore Data</ThemedText>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#666" />
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>About</ThemedText>
                    <TouchableOpacity style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="information-circle-outline" size={24} color="#666" />
                            <ThemedText style={styles.settingText}>Version</ThemedText>
                        </View>
                        <ThemedText style={styles.settingValue}>1.0.0</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="document-text-outline" size={24} color="#666" />
                            <ThemedText style={styles.settingText}>Privacy Policy</ThemedText>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#666" />
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={24} color="white" />
                        <ThemedText style={styles.logoutButtonText}>Logout</ThemedText>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    section: {
        marginTop: 24,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#e0e0e0',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        padding: 16,
        backgroundColor: '#f8f8f8',
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingText: {
        fontSize: 16,
        marginLeft: 12,
    },
    settingValue: {
        fontSize: 16,
        color: '#666',
    },
    footer: {
        padding: 16,
        marginTop: 24,
    },
    logoutButton: {
        backgroundColor: '#F44336',
        padding: 16,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
}); 