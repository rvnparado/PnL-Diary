import React from 'react';
import { View, ViewProps } from 'react-native';

interface ThemedViewProps extends ViewProps {
    children: React.ReactNode;
}

export default function ThemedView({ style, children, ...props }: ThemedViewProps) {
    return (
        <View
            style={[
                {
                    backgroundColor: 'white',
                },
                style,
            ]}
            {...props}>
            {children}
        </View>
    );
} 