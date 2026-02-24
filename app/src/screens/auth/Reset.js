// Password Reset Page
//React Native
import * as React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStyleSheet, StyleService, Layout, Text, Button } from '@ui-kitten/components';

export const Reset = ({navigation}) => {
    const styles = useStyleSheet(resetStyles);

    return (
        <SafeAreaView style={styles.container}>
            <Layout>
                <Text>Reset</Text>
            </Layout>
        </SafeAreaView>
    );
}

const resetStyles = StyleService.create({
    container: {
      flex: 1,
    },
});
  