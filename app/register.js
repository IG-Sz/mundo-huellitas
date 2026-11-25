import { Stack, useRouter } from 'expo-router';
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

import { registerUser } from '../services/authService';
import { useFavoritos } from '../context/favoritosContext';
import FormularioScroll from '../components/formularioScroll';
import { validarTelefono } from '../services/refugios';

const colors = {
    primary: '#795548',
    secondary: '#8A776B',
    background: '#F4E9DF',
    card: '#FFFCF8',
    accent: '#C98276',
};

const Registro = () => {
    const router = useRouter();
    const { recargarFavoritos } = useFavoritos();

    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [telefono, setTelefono] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [rol, setRol] = useState('adoptante');

    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [cargando, setCargando] = useState(false);

    const handleRegister = async () => {
        // Validar campos
        if (!nombre.trim() || !email.trim() ||
            !password || !confirmPassword) {
            Alert.alert(
                'Campos incompletos',
                'Por favor, completá todos los campos.'
            );
            return;
        }

        if (rol === 'refugio' && !telefono.trim()) {
            Alert.alert(
                'Teléfono requerido',
                'Los refugios deben cargar un Teléfono / WhatsApp de contacto.'
            );
            return;
        }

        if (telefono.trim()) {
            const telefonoValido = validarTelefono(telefono);

            if (!telefonoValido.ok) {
                Alert.alert('Teléfono inválido', telefonoValido.mensaje);
                return;
            }
        }

        // Validar email
        const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailValido.test(email.trim())) {
            Alert.alert('Email inválido', 'Ingresá un email válido.');
            return;
        }

        // Validar contraseña
        if (password.length < 6) {
            Alert.alert(
                'Contraseña inválida',
                'La contraseña debe tener al menos 6 caracteres.'
            );
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert(
                'Las contraseñas no coinciden',
                'Verificá que ambas contraseñas sean iguales.'
            );
            return;
        }

        try {
            setCargando(true);

            const result = await registerUser({
                nombre: nombre.trim(),
                email: email.trim().toLowerCase(),
                telefono: telefono.trim(),
                password,
                rol,
            });

            await recargarFavoritos();

            const destino =
                rol === 'refugio'
                ? '/(refugio)/posteos'
                : '/(tabs)/posteos';

            Alert.alert(
                '¡Cuenta creada!',
                'Tu registro se realizó correctamente.',
                [
                    {
                        text: 'Continuar',
                        onPress: () => {
                            router.replace(destino);
                        },
                    },
                ]
            );

        } catch (error) {
            Alert.alert(
                'Error al registrarse',
                error.message || 'Ocurrió un error inesperado.'
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
                                ¡Sumate a nuestra comunidad!
                            </Text>
                        </View>

                        <View style={styles.card}>
                            <Text style={styles.tituloFormulario}>
                                Crear cuenta
                            </Text>

                            <Text style={styles.descripcion}>
                                Completá tus datos para comenzar.
                            </Text>

                            {/* Nombre */}
                            <Text style={styles.label}>
                                Nombre completo
                            </Text>

                            <View style={styles.inputContainer}>
                                <Ionicons
                                    name="person-outline"
                                    size={20}
                                    color={colors.secondary}
                                />

                                <TextInput
                                    style={styles.input}
                                    placeholder="Ingresá tu nombre"
                                    placeholderTextColor="#B5A69B"
                                    value={nombre}
                                    onChangeText={setNombre}
                                    autoCapitalize="words"
                                />
                            </View>

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

                            {/* Teléfono / WhatsApp */}
                            <Text style={styles.label}>
                                Teléfono / WhatsApp
                                {rol === 'refugio' ? ' *' : ''}
                            </Text>

                            <View style={styles.inputContainer}>
                                <Ionicons
                                    name="logo-whatsapp"
                                    size={20}
                                    color={colors.secondary}
                                />

                                <TextInput
                                    style={styles.input}
                                    placeholder="5491123456789"
                                    placeholderTextColor="#B5A69B"
                                    value={telefono}
                                    onChangeText={setTelefono}
                                    keyboardType="phone-pad"
                                />
                            </View>
                            <Text style={styles.hintTelefono}>
                                Debe tener más de 8 dígitos (con código de país,
                                sin + ni espacios).
                            </Text>

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
                                    placeholder="Mínimo 6 caracteres"
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

                            {/* Confirmar contraseña */}
                            <Text style={styles.label}>
                                Confirmar contraseña
                            </Text>

                            <View style={styles.inputContainer}>
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={20}
                                    color={colors.secondary}
                                />

                                <TextInput
                                    style={styles.input}
                                    placeholder="Repetí tu contraseña"
                                    placeholderTextColor="#B5A69B"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!mostrarPassword}
                                    autoCapitalize="none"
                                />
                            </View>

                            {/* Tipo de usuario */}
                            <Text style={styles.label}>
                                ¿Cómo querés participar?
                            </Text>

                            <View style={styles.rolesContainer}>
                                <Pressable
                                    style={[
                                        styles.rolCard,
                                        rol === 'adoptante' &&
                                            styles.rolSeleccionado,
                                    ]}
                                    onPress={() => setRol('adoptante')}
                                >
                                    <Ionicons
                                        name="heart-outline"
                                        size={27}
                                        color={
                                            rol === 'adoptante'
                                                ? colors.accent
                                                : colors.secondary
                                        }
                                    />

                                    <Text style={styles.rolTitulo}>
                                        Adoptante
                                    </Text>

                                    <Text style={styles.rolDescripcion}>
                                        Quiero adoptar
                                    </Text>

                                    {rol === 'adoptante' && (
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={20}
                                            color={colors.accent}
                                            style={styles.checkIcon}
                                        />
                                    )}
                                </Pressable>

                                <Pressable
                                    style={[
                                        styles.rolCard,
                                        rol === 'refugio' &&
                                            styles.rolSeleccionado,
                                    ]}
                                    onPress={() => setRol('refugio')}
                                >
                                    <Ionicons
                                        name="home-outline"
                                        size={27}
                                        color={
                                            rol === 'refugio'
                                                ? colors.accent
                                                : colors.secondary
                                        }
                                    />

                                    <Text style={styles.rolTitulo}>
                                        Refugio
                                    </Text>

                                    <Text style={styles.rolDescripcion}>
                                        Represento un refugio
                                    </Text>

                                    {rol === 'refugio' && (
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={20}
                                            color={colors.accent}
                                            style={styles.checkIcon}
                                        />
                                    )}
                                </Pressable>
                            </View>

                            {/* Botón registro */}
                            <Pressable
                                style={[
                                    styles.boton,
                                    cargando && styles.botonDeshabilitado,
                                ]}
                                onPress={handleRegister}
                                disabled={cargando}
                            >
                                {cargando ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Text style={styles.botonTexto}>
                                            Crear cuenta
                                        </Text>

                                        <Ionicons
                                            name="arrow-forward"
                                            size={20}
                                            color="#FFFFFF"
                                        />
                                    </>
                                )}
                            </Pressable>

                            <View style={styles.loginContainer}>
                                <Text style={styles.loginTexto}>
                                    ¿Ya tenés una cuenta?
                                </Text>

                                <Pressable
                                    onPress={() => router.push('/login')}
                                >
                                    <Text style={styles.loginLink}>
                                        Iniciar sesión
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
    hintTelefono: {
        fontSize: 12,
        color: colors.secondary,
        marginTop: 8,
        lineHeight: 17,
    },
    rolesContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 5,
    },
    rolCard: {
        flex: 1,
        backgroundColor: colors.background,
        borderWidth: 1.5,
        borderColor: 'transparent',
        borderRadius: 14,
        padding: 14,
        alignItems: 'center',
        position: 'relative',
    },
    rolSeleccionado: {
        borderColor: colors.accent,
        backgroundColor: '#FDF1ED',
    },
    rolTitulo: {
        fontSize: 15,
        fontWeight: 'bold',
        color: colors.primary,
        marginTop: 8,
    },
    rolDescripcion: {
        fontSize: 11,
        color: colors.secondary,
        textAlign: 'center',
        marginTop: 4,
    },
    checkIcon: {
        position: 'absolute',
        top: 7,
        right: 7,
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
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginTop: 22,
        gap: 5,
    },
    loginTexto: {
        fontSize: 13,
        color: colors.secondary,
    },
    loginLink: {
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

export default Registro;
