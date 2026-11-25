import { useCallback, useState } from 'react';
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
import { useFocusEffect, useRouter } from 'expo-router';

import {
    clearAllLocalData,
    getCurrentUser,
    logoutUser,
    updateCurrentUser,
} from '../../services/authService';
import { validarTelefono } from '../../services/refugios';
import { useFavoritos } from '../../context/favoritosContext';
import FormularioScroll from '../../components/formularioScroll';

const colors = {
    primary: '#795548',
    secondary: '#8A776B',
    background: '#F5EEE7',
    card: '#FFFCF8',
    soft: '#E8DDD2',
    danger: '#B85C4E',
};

export default function PerfilAdoptante() {
    const router = useRouter();
    const { recargarFavoritos } = useFavoritos();

    const [nombre, setNombre] = useState('');
    const [telefono, setTelefono] = useState('');
    const [email, setEmail] = useState('');
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);

    useFocusEffect(
        useCallback(() => {
            let activo = true;

            const cargar = async () => {
                try {
                    setCargando(true);
                    const usuario = await getCurrentUser();

                    if (!activo) return;

                    if (!usuario) {
                        router.replace('/login');
                        return;
                    }

                    setNombre(usuario.nombre || '');
                    setTelefono(usuario.telefono || '');
                    setEmail(usuario.email || '');
                } catch (error) {
                    console.log('Error al cargar perfil:', error);
                } finally {
                    if (activo) setCargando(false);
                }
            };

            cargar();

            return () => {
                activo = false;
            };
        }, [router])
    );

    const handleGuardar = async () => {
        if (!nombre.trim()) {
            Alert.alert('Campo incompleto', 'El nombre es obligatorio.');
            return;
        }

        if (telefono.trim()) {
            const telefonoValido = validarTelefono(telefono);

            if (!telefonoValido.ok) {
                Alert.alert('Teléfono inválido', telefonoValido.mensaje);
                return;
            }
        }

        try {
            setGuardando(true);

            await updateCurrentUser({
                nombre: nombre.trim(),
                telefono: telefono.trim(),
            });

            Alert.alert(
                'Perfil actualizado',
                'Los cambios se guardaron correctamente.'
            );
        } catch (error) {
            Alert.alert(
                'Error',
                error.message || 'No se pudo guardar el perfil.'
            );
        } finally {
            setGuardando(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Cerrar sesión',
            '¿Seguro que querés salir de tu cuenta?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Cerrar sesión',
                    style: 'destructive',
                    onPress: async () => {
                        await logoutUser();
                        await recargarFavoritos();
                        router.replace('/login');
                    },
                },
            ]
        );
    };

    const handleBorrarDatosLocales = () => {
        Alert.alert(
            'Borrar datos locales',
            'Esto limpia la sesión guardada en el celular. `npx expo start -c` no borra eso.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Borrar todo',
                    style: 'destructive',
                    onPress: async () => {
                        await clearAllLocalData();
                        await recargarFavoritos();
                        router.replace('/register');
                    },
                },
            ]
        );
    };

    if (cargando) {
        return (
            <SafeAreaView style={styles.centrado}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.mensaje}>Cargando perfil...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={['top']} style={styles.container}>
            <FormularioScroll contentContainerStyle={styles.scrollContent}>
                    <Text style={styles.title}>Mi perfil</Text>
                    <Text style={styles.subtitle}>
                        Tus datos de adoptante.
                    </Text>

                    <View style={styles.card}>
                        <Text style={styles.label}>Nombre</Text>
                        <TextInput
                            style={styles.input}
                            value={nombre}
                            onChangeText={setNombre}
                            placeholder="Tu nombre"
                            placeholderTextColor="#B5A69B"
                        />

                        <Text style={styles.label}>Teléfono / WhatsApp</Text>
                        <TextInput
                            style={styles.input}
                            value={telefono}
                            onChangeText={setTelefono}
                            placeholder="5491123456789"
                            placeholderTextColor="#B5A69B"
                            keyboardType="phone-pad"
                        />

                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={[styles.input, styles.inputReadonly]}
                            value={email}
                            editable={false}
                        />

                        <Pressable
                            style={[
                                styles.button,
                                guardando && styles.buttonDisabled,
                            ]}
                            onPress={handleGuardar}
                            disabled={guardando}
                        >
                            {guardando ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.buttonText}>
                                    Guardar cambios
                                </Text>
                            )}
                        </Pressable>

                        <Pressable
                            style={styles.logoutButton}
                            onPress={handleLogout}
                        >
                            <Text style={styles.logoutText}>Cerrar sesión</Text>
                        </Pressable>

                        <Pressable
                            style={styles.clearButton}
                            onPress={handleBorrarDatosLocales}
                        >
                            <Text style={styles.clearText}>
                                Borrar sesión local del dispositivo
                            </Text>
                        </Pressable>
                    </View>
            </FormularioScroll>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    centrado: {
        flex: 1,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.primary,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: colors.secondary,
        textAlign: 'center',
        marginBottom: 16,
    },
    mensaje: {
        color: colors.secondary,
        fontSize: 16,
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        elevation: 2,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: colors.soft,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: colors.primary,
    },
    inputReadonly: {
        backgroundColor: colors.background,
        color: colors.secondary,
    },
    button: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 24,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    logoutButton: {
        borderWidth: 1.5,
        borderColor: colors.danger,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 14,
        backgroundColor: '#FFF5F3',
    },
    logoutText: {
        color: colors.danger,
        fontSize: 16,
        fontWeight: 'bold',
    },
    clearButton: {
        marginTop: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    clearText: {
        color: colors.secondary,
        fontSize: 13,
        textDecorationLine: 'underline',
    },
});
