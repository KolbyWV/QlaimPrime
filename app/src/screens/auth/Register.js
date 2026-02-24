// Create Profile after Signup Only 
//React Native
import * as React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStyleSheet, StyleService, Layout, Text, Button } from '@ui-kitten/components';

export const Register = ({navigation}) => {
    const styles = useStyleSheet(registerStyles);

    return (
        <SafeAreaView style={styles.container}>
            <Layout>
                <Text>Register</Text>
            </Layout>
        </SafeAreaView>
    );
}

const registerStyles = StyleService.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
});
  