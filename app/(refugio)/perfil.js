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
import { resolverCoordenadas } from '../../services/ubicacion';
import DireccionAutocomplete from '../../components/direccionAutocomplete';
import { useFavoritos } from '../../context/favoritosContext';
import FormularioScroll from '../../components/formularioScroll';
import MapaRefugio from '../../components/mapaRefugio';

const colors = {
    primary: '#795548',
    secondary: '#8A776B',
    background: '#F5EEE7',
    card: '#FFFCF8',
    soft: '#E8DDD2',
    accent: '#C98276',
    danger: '#B85C4E',
};

export default function PerfilRefugio() {
    const router = useRouter();
    const { recargarFavoritos } = useFavoritos();

    const [nombre, setNombre] = useState('');
    const [telefono, setTelefono] = useState('');
    const [email, setEmail] = useState('');
    const [direccion, setDireccion] = useState('');
    const [latitude, setLatitude] = useState(null);
    const [longitude, setLongitude] = useState(null);
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
                    setDireccion(
                        usuario.ubicacion || usuario.direccion || ''
                    );
                    setLatitude(
                        typeof usuario.latitude === 'number'
                            ? usuario.latitude
                            : null
                    );
                    setLongitude(
                        typeof usuario.longitude === 'number'
                            ? usuario.longitude
                            : null
                    );
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
        if (!nombre.trim() || !telefono.trim()) {
            Alert.alert(
                'Campos incompletos',
                'Nombre y teléfono son obligatorios.'
            );
            return;
        }

        const telefonoValido = validarTelefono(telefono);

        if (!telefonoValido.ok) {
            Alert.alert('Teléfono inválido', telefonoValido.mensaje);
            return;
        }

        if (!direccion.trim()) {
            Alert.alert(
                'Dirección requerida',
                'Elegí una dirección o localidad de la lista de sugerencias.'
            );
            return;
        }

        try {
            setGuardando(true);

            let coords = {
                latitude,
                longitude,
                direccion: direccion.trim(),
            };

            if (
                typeof coords.latitude !== 'number' ||
                typeof coords.longitude !== 'number'
            ) {
                coords = await resolverCoordenadas({
                    label: direccion.trim(),
                });
                setLatitude(coords.latitude);
                setLongitude(coords.longitude);
                setDireccion(coords.direccion);
            }

            await updateCurrentUser({
                nombre: nombre.trim(),
                telefono: telefono.trim(),
                ubicacion: coords.direccion,
                direccion: coords.direccion,
                latitude: coords.latitude,
                longitude: coords.longitude,
            });

            Alert.alert(
                'Perfil actualizado',
                'Teléfono y ubicación sincronizados con el backend.'
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

    const handleSeleccionarDireccion = async (sugerencia) => {
        try {
            const coords = await resolverCoordenadas(sugerencia);
            setDireccion(coords.direccion);
            setLatitude(coords.latitude);
            setLongitude(coords.longitude);
        } catch (error) {
            Alert.alert(
                'Ubicación',
                error.message || 'No se pudieron obtener las coordenadas.'
            );
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
            'Esto limpia la sesión guardada en el celular. No lo hace `npx expo start -c`.',
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
                        Editá los datos de contacto de tu refugio.
                    </Text>

                    <View style={styles.card}>
                        <Text style={styles.label}>Nombre del refugio</Text>
                        <TextInput
                            style={styles.input}
                            value={nombre}
                            onChangeText={setNombre}
                            placeholder="Nombre del refugio"
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
                        <Text style={styles.hint}>
                            Más de 8 dígitos, con código de país, sin + ni
                            espacios.
                        </Text>

                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={[styles.input, styles.inputReadonly]}
                            value={email}
                            editable={false}
                        />

                        <Text style={styles.label}>Dirección / Localidad</Text>
                        <DireccionAutocomplete
                            value={direccion}
                            onChangeText={(texto) => {
                                setDireccion(texto);
                                setLatitude(null);
                                setLongitude(null);
                            }}
                            onSeleccionar={handleSeleccionarDireccion}
                        />

                        {typeof latitude === 'number' &&
                        typeof longitude === 'number' ? (
                            <View style={styles.mapaPreview}>
                                <Text style={styles.coords}>
                                    Lat: {latitude.toFixed(5)} · Lng:{' '}
                                    {longitude.toFixed(5)}
                                </Text>
                                <MapaRefugio
                                    latitude={latitude}
                                    longitude={longitude}
                                    nombre={nombre || 'Tu refugio'}
                                    height={150}
                                />
                            </View>
                        ) : null}

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
        overflow: 'visible',
        zIndex: 1,
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
    hint: {
        fontSize: 12,
        color: colors.secondary,
        marginTop: 6,
    },
    mapaPreview: {
        marginTop: 14,
        gap: 8,
    },
    coords: {
        fontSize: 12,
        color: colors.secondary,
        textAlign: 'center',
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
