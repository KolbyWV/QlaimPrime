//Authenticate -> Create Profile -> Home  //Login or Signup
import React, {useState, useCallback, useContext} from 'react';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Image, Pressable, Alert } from 'react-native';

import { Formik } from 'formik';
import { useStyleSheet, useTheme, StyleService, Layout, Text, Input, Button } from '@ui-kitten/components';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import * as SecureStore from 'expo-secure-store';

import { useMutation } from '@apollo/client/react';
import { SIGN_UP, SIGN_IN } from '../../graphql/mutations';
import { AuthContext } from '../../context';

import { verticalScale, horizontalScale } from '../../style/metrics';

export const Authenticate = ({navigation}) => {
    const styles = useStyleSheet(authenticateStyles);
    const [secureTextEntry, setSecureTextEntry] = useState(true);
    const [isSignedUp, setIsSignedUp] = useState(true);
    
    const theme = useTheme();

    const toggleSecureEntry = () => {
        setSecureTextEntry(!secureTextEntry);
    }

    const renderPasswordIcon = (props) => (
        <Icon size={24} color={theme['color-primary-700']} name={secureTextEntry ? 'eye-off-outline' : 'eye-outline'} onPress={toggleSecureEntry} />
    );

    const EmailIcon = () => (
        <Icon name='email-outline' size={24} color={theme['color-primary-700']} />
    );

    const PasswordIcon = (props) => (
        <Icon name='lock-outline' size={24} color={theme['color-primary-700']} />
    );

    const { login, register } = useContext(AuthContext);

    const handleValidation = (values) => {
        const errors = {};
        const validateEmail = (email) => {
            return email.match(
              /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            );
          };

        if (validateEmail(values.email)) {} else {
            errors.email = 'Invalid email address';
        }
        if (values.password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
        }

        return errors;
    }

    const [signUp] = useMutation(SIGN_UP, {
        async onCompleted({ signUp }) {
           const { user } = signUp;
           const { token } = signUp;
           try {
                await SecureStore.setItemAsync('token', token);
                await SecureStore.setItemAsync('userId', user.id);
                register();
           } catch (error) {
               Alert.alert('Error', 'An error occurred. Please try again.');
           }
        },
        onError(error) {
            Alert.alert('Error', 'An error occurred. Please try again.');
        },
    });

    const [signIn] = useMutation(SIGN_IN, {
        async onCompleted({ signIn }) {
            const { user } = signIn;
            const { token } = signIn;
            try {
                await SecureStore.setItemAsync('token', token);
                await SecureStore.setItemAsync('userId', user.id);
                login();
            } catch (error) {
                Alert.alert('Error', 'An error occurred. Please try again.');
            }
        },
        onError(error) {
            Alert.alert('Error', 'An error occurred. Please try again.');
        },
    });

    return (
        <SafeAreaView style={styles.container}>
            <Image
                accessibilityLabel="Qlaim"
                accessible={true}
                style={styles.image}
                resizeMode='cover'
                source={require('../../images/logos/QlaimBig.png')}
            />
            {!isSignedUp ?
                <Formik 
                    initialValues={{email: '', password: ''}}
                    validate={handleValidation}
                    onSubmit={(values) => {
                        signUp({variables: {email: values.email, password: values.password}});
                    }}
                >
                    {({handleChange, handleBlur, handleSubmit, values, errors, touched}) => (
                        <Layout level='2' style={styles.formContainer}>
                            <Text category='h6' status="primary" style={styles.sectionTitle}>Sign Up</Text>
                            <Input
                                label='Email'
                                placeholder='Email'
                                accessoryLeft={EmailIcon}
                                onChangeText={handleChange('email')}
                                onBlur={handleBlur('email')}
                                autoCapitalize='none'
                                value={values.email}
                                style={styles.input}
                            />
                            {errors.email && touched.email ? <Text status='danger'>{errors.email}</Text> : null}
                            <Input
                                label='Password'
                                placeholder='Password'
                                accessoryLeft={PasswordIcon}
                                accessoryRight={renderPasswordIcon}
                                secureTextEntry={secureTextEntry}
                                onChangeText={handleChange('password')}
                                onBlur={handleBlur('password')}
                                autoCapitalize='none'
                                value={values.password}
                                style={styles.bottomInput}
                            />
                            {errors.password && touched.password ? <Text status='danger'>{errors.password}</Text> : null}
                            <Pressable onPress={() => navigation.navigate('Reset')}>
                                <Text category='s1' status='basic' style={styles.topSpace}>Forgot password?</Text>
                            </Pressable>
                            <Button style={[styles.button, styles.boxShadow]} size='large' onPress={handleSubmit}>Sign up</Button>
                            <Button  size='medium' appearance='ghost' status='basic' onPress={() => setIsSignedUp(!isSignedUp)}>
                                <Text style={styles.topSpace}>Already have an account? Sign in</Text>
                            </Button>
                        </Layout>
                    )}

                </Formik>
            :
                <Formik
                    initialValues={{email: '', password: ''}}
                    validate={handleValidation}
                    onSubmit={(values) => {
                        signIn({variables: {email: values.email, password: values.password}});
                    }}
                >
                    {({handleChange, handleBlur, handleSubmit, values, errors, touched}) => (
                        <Layout level='2' style={styles.formContainer}>
                             <Text category='h6' status="primary" style={styles.sectionTitle}>Sign In</Text>
                            <Input
                                label='Email'
                                placeholder='Email'
                                accessoryLeft={EmailIcon}
                                onChangeText={handleChange('email')}
                                onBlur={handleBlur('email')}
                                value={values.email}
                                autoCapitalize='none'
                                style={styles.input}
                            />
                            {errors.email && touched.email ? <Text status='danger'>{errors.email}</Text> : null}
                            <Input
                                label='Password'
                                placeholder='Password'
                                accessoryLeft={PasswordIcon}
                                accessoryRight={renderPasswordIcon}
                                secureTextEntry={secureTextEntry}
                                onChangeText={handleChange('password')}
                                onBlur={handleBlur('password')}
                                value={values.password}
                                autoCapitalize='none'
                                style={styles.bottomInput}
                            />
                            {errors.password && touched.password ? <Text status='danger'>{errors.password}</Text> : null}
                            <Pressable onPress={() => navigation.navigate('Reset')}>
                                <Text category='s1' status='basic' style={styles.topSpace}>Forgot password?</Text>
                            </Pressable>
                            <Button style={[styles.button, styles.boxShadow]} size='large' onPress={handleSubmit}>Sign In</Button>
                            <Button  size='medium' appearance='ghost' status='basic' onPress={() => setIsSignedUp(!isSignedUp)}>
                                <Text style={styles.topSpace}>Don't have an account? Sign up now</Text>
                            </Button>
                        </Layout>
                    )}
                </Formik>
            }
        </SafeAreaView>
    );
}

const authenticateStyles = StyleService.create({
    container: {
      flex: 1,
    },
    image: {
        alignSelf: 'center',
        marginVertical: verticalScale(5),
        width: horizontalScale(250),
        height: verticalScale(80),
    },
    sectionTitle: {
        marginTop: verticalScale(20),
        marginBottom: verticalScale(30),
        color: 'color-primary-700',
        textTransform: 'uppercase',
    },
    formContainer: {
        paddingHorizontal: horizontalScale(15),
        paddingVertical: verticalScale(10),
    },
    input: {
        marginBottom: verticalScale(25),
        borderRadius: 5
    },
    bottomInput: {
        marginBottom: verticalScale(5),
        borderRadius: 5
    },
    button: {
        marginTop: verticalScale(40),
        marginBottom: verticalScale(10),
        borderRadius: 5,
        backgroundColor: 'color-primary-700',
    },
    boxShadow: {
        shadowColor: '#171717',
        shadowOffset: {width: -2, height: 4},
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 10
    },
    topSpace: {
        marginTop: verticalScale(5),
        textDecorationLine: 'underline',
    }
});
  