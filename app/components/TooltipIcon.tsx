import React from 'react';
import { TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Portal, Dialog } from 'react-native-paper';
import ThemedText from './ThemedText';

interface Props {
    text: string;
}

const TooltipIcon = ({ text }: Props) => {
    const [visible, setVisible] = React.useState(false);

    const showTooltip = () => setVisible(true);
    const hideTooltip = () => setVisible(false);

    return (
        <>
            <TouchableOpacity onPress={showTooltip}>
                <MaterialIcons name="info-outline" size={20} color="#666" />
            </TouchableOpacity>

            <Portal>
                <Dialog visible={visible} onDismiss={hideTooltip}>
                    <Dialog.Title>Info</Dialog.Title>
                    <Dialog.Content>
                        <ThemedText style={{ fontSize: 14, lineHeight: 20 }}>
                            {text}
                        </ThemedText>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <TouchableOpacity
                            onPress={hideTooltip}
                            style={{ padding: 8, marginRight: 8 }}
                        >
                            <ThemedText style={{ color: '#2196F3', fontWeight: '500' }}>
                                Got it
                            </ThemedText>
                        </TouchableOpacity>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </>
    );
};

export default TooltipIcon; 