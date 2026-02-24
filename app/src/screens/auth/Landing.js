//React Native
import React, { useState} from 'react';
import { SafeAreaView} from 'react-native-safe-area-context';
import { Image } from 'react-native';
import { useStyleSheet, useTheme, StyleService, Layout, Text, Button } from '@ui-kitten/components';
import Icon from 'react-native-vector-icons/Ionicons';


export const Landing = ({navigation}) => {
    const styles = useStyleSheet(landingStyles);
    const theme = useTheme();

    const [imageError, setImageError] = useState(false);

    const handleJoinOrSignIn = () => {
        navigation.navigate('Authenticate');
    }

    const handleImageError = () => {
        setImageError(true);
    }

    const RightArrow = () => (
        <Icon name='chevron-forward' size={24} color={theme['color-primary-400']} />
    )


    return (
        <SafeAreaView style={styles.container}>
            <Layout level='2' style={styles.landing}>
                <Layout level='2' style={styles.logo}>
                    <Image
                        accessibilityLabel="Qlaim"
                        accessible={true}
                        style={styles.logoImage}
                        resizeMethod='auto'
                        resizeMode='cover'
                        source={imageError ? require('../../images/auth/errorImage.png') : require('../../images/logos/QlaimBig.png')}
                        onError={handleImageError}
                    />
                </Layout>
                <Layout level='2' style={styles.bottom}>
                    <Layout level='2' style={styles.main}>
                        <Image
                            accessibilityLabel="Main Illustration"
                            accessible={true}
                            style={styles.image}
                            resizeMode='cover'
                            source={imageError ? require('../../images/auth/errorImage.png') : require('../../images/auth/homeIllustration.png')}
                            onError={handleImageError} // Handle image loading error
                        />
                        <Text category='h6' style={styles.title}>
                            Shift Happens. Earn Money Better.
                        </Text>
                        <Text category='s1' accessibilityRole="text" style={styles.subtitle}>
                            Qlaim is a platform that connects you with companies that need your help. 
                            Sign up and start earning money today.
                        </Text>
                    </Layout>
                    <Layout level='2'>
                        <Button
                            onPress={handleJoinOrSignIn}
                            style={styles.button}
                            accessoryRight={RightArrow}
                            size='large'
                        >
                            Join or Sign In
                        </Button>
                    </Layout>
                </Layout>
            </Layout>
        </SafeAreaView>
    );
}

const landingStyles = StyleService.create({
    container: {
      flex: 1,
    },
    landing: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'flex-start',
    },
    logo: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    main: {
        marginTop: 40,
        alignItems: 'center',
    },
    bottom: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    logoImage: {
        width: '100%',
        height: 140,
    },
    image: {
        margin: 20,
        width: '100%',
        height: 200,
    },
    title: {
        marginTop: 20,
        marginBottom: 5,
        color: 'color-primary-800', 
    },
    subtitle: {
        marginHorizontal: 20, 
        marginTop: 10, 
    },
    button: {
        height: 60,
        marginHorizontal: 40 ,
        justifyContent: 'space-between',
        backgroundColor: 'color-primary-800', 
    }
});
  