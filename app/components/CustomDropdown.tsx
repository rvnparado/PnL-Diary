import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
    Modal,
    FlatList,
} from 'react-native';
import ThemedText from './ThemedText';
import { Ionicons } from '@expo/vector-icons';

interface CustomDropdownProps {
    items: string[];
    selectedItems: string[];
    onSelect: (items: string[]) => void;
    onAdd?: (item: string) => void;
    onRemove?: (item: string) => void;
    placeholder?: string;
    error?: string;
}

export default function CustomDropdown({
    items,
    selectedItems,
    onSelect,
    onAdd,
    onRemove,
    placeholder = 'Select items',
    error,
}: CustomDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newItem, setNewItem] = useState('');

    const handleSelect = (item: string) => {
        const newSelection = selectedItems.includes(item)
            ? selectedItems.filter(v => v !== item)
            : [...selectedItems, item];
        onSelect(newSelection);
    };

    const handleAddNew = () => {
        if (newItem.trim() && onAdd) {
            onAdd(newItem.trim());
            onSelect([...selectedItems, newItem.trim()]);
            setNewItem('');
            setIsAddingNew(false);
            setIsOpen(false);
        }
    };

    const handleRemove = (item: string) => {
        if (onRemove) {
            Alert.alert(
                'Remove Item',
                `Are you sure you want to remove "${item}"?`,
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                    {
                        text: 'Remove',
                        style: 'destructive',
                        onPress: () => {
                            onRemove(item);
                            onSelect(selectedItems.filter(v => v !== item));
                        },
                    },
                ]
            );
        }
    };

    const filteredItems = items.filter(item =>
        item.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[styles.header, error ? styles.errorBorder : null]}
                onPress={() => setIsOpen(!isOpen)}
            >
                <View style={styles.selectedValues}>
                    {selectedItems.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.tagsContainer}>
                                {selectedItems.map((value) => (
                                    <View key={value} style={styles.tag}>
                                        <ThemedText style={styles.tagText}>{value}</ThemedText>
                                        <TouchableOpacity
                                            onPress={() => handleSelect(value)}
                                            style={styles.removeTag}>
                                            <Ionicons name="close" size={16} color="#666" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        </ScrollView>
                    ) : (
                        <ThemedText style={styles.placeholder}>{placeholder}</ThemedText>
                    )}
                </View>
                <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color="#666"
                />
            </TouchableOpacity>

            {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}

            <Modal
                visible={isOpen}
                transparent
                animationType="fade"
                onRequestClose={() => {
                    setIsOpen(false);
                    setSearch('');
                    setIsAddingNew(false);
                }}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => {
                        setIsOpen(false);
                        setSearch('');
                        setIsAddingNew(false);
                    }}
                >
                    <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                        <View style={styles.searchContainer}>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search..."
                                value={search}
                                onChangeText={setSearch}
                                autoFocus
                            />
                            {onAdd && !isAddingNew && (
                                <TouchableOpacity
                                    style={styles.addButton}
                                    onPress={() => {
                                        setIsAddingNew(true);
                                        setSearch('');
                                    }}
                                >
                                    <Ionicons name="add" size={24} color="#2196F3" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {isAddingNew ? (
                            <View style={styles.addNewContainer}>
                                <TextInput
                                    style={styles.addNewInput}
                                    placeholder="Enter new item"
                                    value={newItem}
                                    onChangeText={setNewItem}
                                    autoFocus
                                    onSubmitEditing={handleAddNew}
                                />
                                <View style={styles.addNewButtons}>
                                    <TouchableOpacity
                                        style={[styles.addNewButton, styles.cancelButton]}
                                        onPress={() => {
                                            setIsAddingNew(false);
                                            setNewItem('');
                                        }}
                                    >
                                        <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.addNewButton}
                                        onPress={handleAddNew}
                                    >
                                        <ThemedText style={styles.addNewButtonText}>Add</ThemedText>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <FlatList
                                data={filteredItems}
                                keyExtractor={(item) => item}
                                renderItem={({ item }) => (
                                    <View style={styles.itemContainer}>
                                        <TouchableOpacity
                                            style={styles.item}
                                            onPress={() => handleSelect(item)}
                                        >
                                            <ThemedText>{item}</ThemedText>
                                            {selectedItems.includes(item) && (
                                                <Ionicons name="checkmark" size={20} color="#2196F3" />
                                            )}
                                        </TouchableOpacity>
                                        {onRemove && (
                                            <TouchableOpacity
                                                style={styles.removeOption}
                                                onPress={() => handleRemove(item)}
                                            >
                                                <Ionicons name="trash-outline" size={20} color="#f44336" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}
                                style={styles.list}
                            />
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f5f5f5',
        padding: 12,
        borderRadius: 8,
    },
    errorBorder: {
        borderWidth: 1,
        borderColor: '#f44336',
    },
    selectedValues: {
        flex: 1,
        marginRight: 8,
    },
    placeholder: {
        color: '#999',
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e3f2fd',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 16,
        marginRight: 8,
    },
    tagText: {
        marginRight: 4,
        color: '#2196F3',
    },
    removeTag: {
        padding: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        width: '90%',
        maxWidth: 400,
        maxHeight: '80%',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 12,
        borderRadius: 8,
        fontSize: 16,
    },
    addButton: {
        padding: 8,
    },
    list: {
        maxHeight: 300,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    item: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
    },
    removeOption: {
        padding: 12,
    },
    addNewContainer: {
        gap: 16,
    },
    addNewInput: {
        backgroundColor: '#f5f5f5',
        padding: 12,
        borderRadius: 8,
        fontSize: 16,
    },
    addNewButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
    },
    addNewButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#2196F3',
    },
    cancelButton: {
        backgroundColor: '#f5f5f5',
    },
    addNewButtonText: {
        color: 'white',
        fontWeight: '600',
    },
    cancelButtonText: {
        color: '#666',
        fontWeight: '600',
    },
    errorText: {
        color: '#f44336',
        fontSize: 12,
        marginTop: 4,
    },
}); 