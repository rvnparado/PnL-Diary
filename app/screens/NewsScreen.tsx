import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Linking,
    RefreshControl,
    Alert,
} from 'react-native';
import ThemedText from '../components/ThemedText';
import ThemedView from '../components/ThemedView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../config/firebase';
import { Ionicons } from '@expo/vector-icons';

interface NewsItem {
    id: string;
    title: string;
    summary: string;
    source: string;
    date: string;
    url: string;
}

const mockNews: NewsItem[] = [
    {
        id: '1',
        title: 'Bitcoin Surges Past $60,000',
        summary: 'Bitcoin reaches new heights as institutional adoption continues to grow...',
        source: 'CryptoNews',
        date: '2024-03-23',
        url: 'https://example.com/news/1'
    },
    {
        id: '2',
        title: 'Ethereum 2.0 Update Progress',
        summary: 'The Ethereum network prepares for its next major upgrade...',
        source: 'BlockchainDaily',
        date: '2024-03-22',
        url: 'https://example.com/news/2'
    },
    {
        id: '3',
        title: 'New Regulations Impact Crypto Markets',
        summary: 'Recent regulatory changes affect global cryptocurrency trading...',
        source: 'CryptoInsider',
        date: '2024-03-21',
        url: 'https://example.com/news/3'
    }
];

export default function NewsScreen() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadNews();
    }, []);

    const loadNews = async () => {
        try {
            setLoading(true);
            const userId = auth.currentUser?.uid;
            if (!userId) {
                console.error('No user logged in');
                return;
            }

            // TODO: Replace with actual news service call
            // const newsData = await NewsService.getLatestNews();
            setNews(mockNews);
        } catch (error) {
            console.error('Error loading news:', error);
            Alert.alert('Error', 'Failed to load news');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        try {
            await loadNews();
        } finally {
            setRefreshing(false);
        }
    }, []);

    const handleNewsPress = async (url: string) => {
        try {
            await Linking.openURL(url);
        } catch (error) {
            console.error('Error opening URL:', error);
        }
    };

    return (
        <SafeAreaView style={styles.mainContainer} edges={['top', 'right', 'left']}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#2196F3']} // Android
                        tintColor="#2196F3" // iOS
                    />
                }
            >
                <ThemedView style={styles.header}>
                    <ThemedText style={styles.title}>Market News</ThemedText>
                </ThemedView>

                <View style={styles.newsContainer}>
                    {news.map((item) => (
                        <TouchableOpacity key={item.id} style={styles.newsCard} onPress={() => handleNewsPress(item.url)}>
                            <View style={styles.newsHeader}>
                                <ThemedText style={styles.newsTitle}>{item.title}</ThemedText>
                                <ThemedText style={styles.newsDate}>{item.date}</ThemedText>
                            </View>
                            <ThemedText style={styles.newsSummary}>{item.summary}</ThemedText>
                            <View style={styles.newsFooter}>
                                <ThemedText style={styles.newsSource}>{item.source}</ThemedText>
                                <Ionicons name="chevron-forward" size={20} color="#666" />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 20,
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
    newsContainer: {
        padding: 16,
    },
    newsCard: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    newsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    newsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
        marginRight: 8,
    },
    newsDate: {
        fontSize: 12,
        color: '#666',
    },
    newsSummary: {
        fontSize: 14,
        color: '#333',
        marginBottom: 12,
        lineHeight: 20,
    },
    newsFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    newsSource: {
        fontSize: 12,
        color: '#2196F3',
        fontWeight: '500',
    },
}); 