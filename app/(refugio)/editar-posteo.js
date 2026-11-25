import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { actualizarPosteo, getPosteoById } from '../../services/posteos';
import { subirImagen } from '../../services/imagenes';
import FormularioScroll from '../../components/formularioScroll';

const colors = {
    primary: '#795548',
    secondary: '#8A776B',
    background: '#F5EEE7',
    card: '#FFFCF8',
    soft: '#E8DDD2',
};

export default function EditarPosteo() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const posteoId = Array.isArray(id) ? id[0] : id;

    const [titulo, setTitulo] = useState('');
    const [texto, setTexto] = useState('');
    const [imagen, setImagen] = useState('');
    const [fotoLocal, setFotoLocal] = useState(null);
    const [mimeFoto, setMimeFoto] = useState('image/jpeg');
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);

    const cargar = useCallback(async () => {
        try {
            setCargando(true);
            const posteo = await getPosteoById(posteoId);
            setTitulo(posteo?.titulo || '');
            setTexto(posteo?.texto || '');
            setImagen(posteo?.imagen || '');
        } catch (error) {
            Alert.alert(
                'Error',
                error.message || 'No se pudo cargar la publicación.',
                [{ text: 'Volver', onPress: () => router.back() }]
            );
        } finally {
            setCargando(false);
        }
    }, [posteoId, router]);

    useEffect(() => {
        cargar();
    }, [cargar]);

    const elegirFoto = async () => {
        try {
            const permission =
                await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permission.granted) {
                Alert.alert(
                    'Permiso requerido',
                    'Necesitamos acceso a tu galería para cambiar la foto.'
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.5,
            });

            if (result.canceled || !result.assets?.[0]?.uri) {
                return;
            }

            const asset = result.assets[0];
            setFotoLocal(asset.uri);
            setMimeFoto(asset.mimeType || 'image/jpeg');
        } catch (error) {
            Alert.alert('Error', 'No se pudo abrir la galería.');
        }
    };

    const guardar = async () => {
        if (!titulo.trim() || !texto.trim()) {
            Alert.alert('Campos incompletos', 'Completá el título y el texto.');
            return;
        }

        try {
            setGuardando(true);
            const urlFoto = fotoLocal
                ? await subirImagen(fotoLocal, mimeFoto)
                : imagen;

            await actualizarPosteo(posteoId, {
                titulo: titulo.trim(),
                texto: texto.trim(),
                imagen: urlFoto,
            });
            setImagen(urlFoto);
            setFotoLocal(null);
            Alert.alert('Publicación actualizada', 'Los cambios ya quedaron guardados.', [
                { text: 'Listo', onPress: () => router.back() },
            ]);
        } catch (error) {
            Alert.alert(
                'Error',
                error.message || 'No se pudo editar la publicación.'
            );
        } finally {
            setGuardando(false);
        }
    };

    if (cargando) {
        return (
            <SafeAreaView style={styles.centrado}>
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <FormularioScroll contentContainerStyle={styles.scroll}>
                    <Pressable style={styles.volver} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={22} color={colors.primary} />
                        <Text style={styles.volverTexto}>Volver</Text>
                    </Pressable>

                    <Text style={styles.title}>Editar publicación</Text>

                    <Text style={styles.label}>Foto</Text>
                    <Pressable style={styles.photoBox} onPress={elegirFoto}>
                        {fotoLocal || imagen ? (
                            <Image
                                source={{ uri: fotoLocal || imagen }}
                                style={styles.photo}
                            />
                        ) : (
                            <View style={styles.photoPlaceholder}>
                                <Ionicons
                                    name="image-outline"
                                    size={32}
                                    color={colors.secondary}
                                />
                            </View>
                        )}
                        <Text style={styles.photoHint}>
                            Tocá la foto para cambiarla
                        </Text>
                    </Pressable>

                    <Text style={styles.label}>Título</Text>
                    <TextInput
                        style={styles.input}
                        value={titulo}
                        onChangeText={setTitulo}
                        placeholder="Título del posteo"
                        placeholderTextColor={colors.secondary}
                    />

                    <Text style={styles.label}>Texto</Text>
                    <TextInput
                        style={[styles.input, styles.texto]}
                        value={texto}
                        onChangeText={setTexto}
                        placeholder="Contá la historia..."
                        placeholderTextColor={colors.secondary}
                        multiline
                    />

                    <Pressable
                        style={styles.guardar}
                        onPress={guardar}
                        disabled={guardando}
                    >
                        {guardando ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.guardarTexto}>Guardar cambios</Text>
                        )}
                    </Pressable>
            </FormularioScroll>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    centrado: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
    },
    scroll: {
        padding: 16,
        paddingBottom: 40,
    },
    volver: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },
    volverTexto: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: '600',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 16,
    },
    label: {
        color: colors.primary,
        fontWeight: '600',
        marginBottom: 6,
        marginTop: 8,
    },
    photoBox: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.soft,
        backgroundColor: colors.card,
    },
    photo: {
        width: '100%',
        height: 180,
        backgroundColor: colors.soft,
    },
    photoPlaceholder: {
        height: 180,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.soft,
    },
    photoHint: {
        textAlign: 'center',
        color: colors.secondary,
        fontSize: 13,
        paddingVertical: 8,
    },
    input: {
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.soft,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        color: colors.primary,
    },
    texto: {
        minHeight: 140,
        textAlignVertical: 'top',
    },
    guardar: {
        marginTop: 20,
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    guardarTexto: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
