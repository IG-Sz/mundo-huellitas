
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';

import { loginUser } from '../services/authService';
import FormularioScroll from '../components/formularioScroll';
import { useFavoritos } from '../context/favoritosContext';

const colors = {
    primary: '#795548',
    secondary: '#8A776B',
    background: '#F4E9DF',
    card: '#FFFCF8',
    accent: '#C98276',
};

const Login = () => {
    const router = useRouter();
    const { recargarFavoritos } = useFavoritos();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [cargando, setCargando] = useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !password) {
            Alert.alert(
                'Campos incompletos',
                'Ingresá tu email y contraseña.'
            );
            return;
        }

        try {
            setCargando(true);

            const result = await loginUser({
                email: email.trim().toLowerCase(),
                password,
            });

            await recargarFavoritos();

            router.replace(
                result?.user?.rol === 'refugio'
                    ? '/(refugio)/posteos'
                    : '/(tabs)/posteos'
            );

        } catch (error) {
            Alert.alert(
                'Error al iniciar sesión',
                error.message || 'Verificá tu email y contraseña.'
            );
        } finally {
            setCargando(false);
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <SafeAreaView style={styles.container}>
                <FormularioScroll contentContainerStyle={styles.scrollContent}>
                        <View style={styles.header}>
                            <View style={styles.logo}>
                                <Ionicons
                                    name="paw"
                                    size={38}
                                    color={colors.card}
                                />
                            </View>

                            <Text style={styles.titulo}>
                                Mundo Huellitas
                            </Text>

                            <Text style={styles.subtitulo}>
                                ¡Qué bueno tenerte de vuelta!
                            </Text>
                        </View>

                        <View style={styles.card}>
                            <Text style={styles.tituloFormulario}>
                                Iniciar sesión
                            </Text>

                            <Text style={styles.descripcion}>
                                Ingresá tus datos para continuar.
                            </Text>

                            {/* Email */}
                            <Text style={styles.label}>Email</Text>

                            <View style={styles.inputContainer}>
                                <Ionicons
                                    name="mail-outline"
                                    size={20}
                                    color={colors.secondary}
                                />

                                <TextInput
                                    style={styles.input}
                                    placeholder="ejemplo@email.com"
                                    placeholderTextColor="#B5A69B"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>

                            {/* Contraseña */}
                            <Text style={styles.label}>Contraseña</Text>

                            <View style={styles.inputContainer}>
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={20}
                                    color={colors.secondary}
                                />

                                <TextInput
                                    style={styles.input}
                                    placeholder="Ingresá tu contraseña"
                                    placeholderTextColor="#B5A69B"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!mostrarPassword}
                                    autoCapitalize="none"
                                />

                                <Pressable
                                    onPress={() =>
                                        setMostrarPassword(!mostrarPassword)
                                    }
                                >
                                    <Ionicons
                                        name={
                                            mostrarPassword
                                                ? 'eye-off-outline'
                                                : 'eye-outline'
                                        }
                                        size={21}
                                        color={colors.secondary}
                                    />
                                </Pressable>
                            </View>

                            {/* Botón iniciar sesión */}
                            <Pressable
                                style={[
                                    styles.boton,
                                    cargando && styles.botonDeshabilitado,
                                ]}
                                onPress={handleLogin}
                                disabled={cargando}
                            >
                                {cargando ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Text style={styles.botonTexto}>
                                            Iniciar sesión
                                        </Text>

                                        <Ionicons
                                            name="arrow-forward"
                                            size={20}
                                            color="#FFFFFF"
                                        />
                                    </>
                                )}
                            </Pressable>

                            {/* Volver al registro */}
                            <View style={styles.registroContainer}>
                                <Text style={styles.registroTexto}>
                                    ¿Todavía no tenés una cuenta?
                                </Text>

                                <Pressable
                                    onPress={() => router.replace('/register')}
                                >
                                    <Text style={styles.registroLink}>
                                        Registrate
                                    </Text>
                                </Pressable>
                            </View>
                        </View>

                        <Text style={styles.pie}>
                            Hecho con ❤️ para quienes aman a los animales.
                        </Text>
                </FormularioScroll>
            </SafeAreaView>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },

    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
        paddingBottom: 30,
    },

    header: {
        alignItems: 'center',
        marginTop: 15,
        marginBottom: 25,
    },

    logo: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },

    titulo: {
        fontSize: 27,
        fontWeight: 'bold',
        color: colors.primary,
    },

    subtitulo: {
        fontSize: 15,
        color: colors.secondary,
        marginTop: 5,
    },

    card: {
        backgroundColor: colors.card,
        borderRadius: 22,
        padding: 22,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },

    tituloFormulario: {
        fontSize: 25,
        fontWeight: 'bold',
        color: colors.primary,
    },

    descripcion: {
        fontSize: 14,
        color: colors.secondary,
        marginTop: 5,
        marginBottom: 22,
    },

    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
        marginBottom: 8,
        marginTop: 15,
    },

    inputContainer: {
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: 12,
        paddingHorizontal: 14,
        gap: 10,
    },

    input: {
        flex: 1,
        fontSize: 14,
        color: colors.primary,
    },

    boton: {
        height: 54,
        backgroundColor: colors.primary,
        borderRadius: 14,
        marginTop: 28,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },

    botonDeshabilitado: {
        opacity: 0.7,
    },

    botonTexto: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },

    registroContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginTop: 22,
        gap: 5,
    },

    registroTexto: {
        fontSize: 13,
        color: colors.secondary,
    },

    registroLink: {
        fontSize: 13,
        color: colors.primary,
        fontWeight: 'bold',
    },

    pie: {
        textAlign: 'center',
        fontSize: 12,
        color: colors.secondary,
        marginTop: 25,
    },
});

export default Login;
