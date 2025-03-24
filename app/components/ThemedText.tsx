import React from 'react';
import { Text, TextProps } from 'react-native';

interface ThemedTextProps extends TextProps {
    children: React.ReactNode;
}

export default function ThemedText({ style, children, ...props }: ThemedTextProps) {
    return (
        <Text
            style={[
                {
                    color: '#333333',
                    fontSize: 16,
                },
                style,
            ]}
            {...props}>
            {children}
        </Text>
    );
} 