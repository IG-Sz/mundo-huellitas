import { useState } from 'react';
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
import { useRouter } from 'expo-router';

import { crearAnimal } from '../../services/animales';
import { crearPosteo } from '../../services/posteos';
import { subirImagen } from '../../services/imagenes';
import { getCurrentUser } from '../../services/authService';
import FormularioScroll from '../../components/formularioScroll';

const colors = {
    primary: '#795548',
    secondary: '#8A776B',
    background: '#F5EEE7',
    card: '#FFFCF8',
    soft: '#E8DDD2',
};

const ESPECIES = ['Perro', 'Gato', 'Roedor'];
const SEXOS = ['Hembra', 'Macho'];
const EDADES = [
    { label: 'Menor de 1 año', value: 0 },
    { label: '1 a 3 años', value: 2 },
    { label: 'Más de 3 años', value: 4 },
];

const IMAGEN_DEFAULT =
    'https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=800&q=80';

function Chip({ label, activo, onPress }) {
    return (
        <Pressable
            onPress={onPress}
            style={[styles.chip, activo && styles.chipActive]}
        >
            <Text style={[styles.chipText, activo && styles.chipTextActive]}>
                {label}
            </Text>
        </Pressable>
    );
}

export default function NuevoPosteo() {
    const router = useRouter();

    const [nombre, setNombre] = useState('');
    const [especie, setEspecie] = useState('Perro');
    const [raza, setRaza] = useState('');
    const [edad, setEdad] = useState(0);
    const [sexo, setSexo] = useState('Hembra');
    const [descripcion, setDescripcion] = useState('');
    const [imagenUri, setImagenUri] = useState(null);
    const [imagenMimeType, setImagenMimeType] = useState(null);
    const [publicando, setPublicando] = useState(false);

    const elegirFoto = async () => {
        try {
            const permission =
                await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permission.granted) {
                Alert.alert(
                    'Permiso requerido',
                    'Necesitamos acceso a tu galería.'
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.5,
            });

            if (!result.canceled) {
                const asset = result.assets[0];
                setImagenUri(asset.uri);
                setImagenMimeType(asset.mimeType || 'image/jpeg');
            }
        } catch (error) {
            Alert.alert('Error', 'No se pudo abrir la galería.');
        }
    };

    const handlePublicar = async () => {
        if (!nombre.trim() || !descripcion.trim()) {
            Alert.alert(
                'Campos incompletos',
                'Completá nombre y descripción.'
            );
            return;
        }

        try {
            setPublicando(true);

            const usuario = await getCurrentUser();
            if (!usuario?.id) {
                Alert.alert('Sesión requerida', 'Volvé a iniciar sesión.');
                router.replace('/login');
                return;
            }

            let imagen = IMAGEN_DEFAULT;
            if (imagenUri && /^https?:\/\//i.test(imagenUri)) {
                imagen = imagenUri;
            } else if (imagenUri) {
                imagen = await subirImagen(imagenUri, imagenMimeType);
            }

            const nombreLimpio = nombre.trim();
            const descripcionLimpia = descripcion.trim();

            const animal = await crearAnimal({
                nombre: nombreLimpio,
                especie,
                raza: raza.trim(),
                edad,
                sexo,
                descripcion: descripcionLimpia,
                imagen,
            });

            await crearPosteo({
                titulo: `${nombreLimpio} busca un hogar`,
                texto: descripcionLimpia,
                imagen,
                animal_id: animal.animalId,
            });

            Alert.alert('Publicación lista', `${nombreLimpio} ya está en tus animales.`, [
                {
                    text: 'Ver mis animales',
                    onPress: () => router.replace('/(refugio)/animales'),
                },
            ]);
        } catch (error) {
            Alert.alert(
                'Error al publicar',
                error.message || 'No se pudo crear la publicación.'
            );
        } finally {
            setPublicando(false);
        }
    };

    return (
        <SafeAreaView edges={['top']} style={styles.container}>
            <FormularioScroll contentContainerStyle={styles.content}>
                    <Pressable
                        onPress={() => router.back()}
                        style={styles.back}
                    >
                        <Ionicons
                            name="arrow-back"
                            size={22}
                            color={colors.primary}
                        />
                        <Text style={styles.backText}>Volver</Text>
                    </Pressable>

                    <Text style={styles.title}>Publicar animal</Text>
                    <Text style={styles.subtitle}>
                        Completá los datos del animal
                    </Text>

                    <Pressable style={styles.photoBox} onPress={elegirFoto}>
                        {imagenUri ? (
                            <Image
                                source={{ uri: imagenUri }}
                                style={styles.photo}
                            />
                        ) : (
                            <View style={styles.photoPlaceholder}>
                                <Ionicons
                                    name="image-outline"
                                    size={32}
                                    color={colors.secondary}
                                />
                                <Text style={styles.photoText}>
                                    Elegir foto
                                </Text>
                            </View>
                        )}
                    </Pressable>

                    <Text style={styles.label}>Nombre</Text>
                    <TextInput
                        style={styles.input}
                        value={nombre}
                        onChangeText={setNombre}
                        placeholder="Nombre del animal"
                        placeholderTextColor={colors.secondary}
                    />

                    <Text style={styles.label}>Tipo de animal</Text>
                    <View style={styles.chips}>
                        {ESPECIES.map((item) => (
                            <Chip
                                key={item}
                                label={item}
                                activo={especie === item}
                                onPress={() => setEspecie(item)}
                            />
                        ))}
                    </View>

                    <Text style={styles.label}>Raza</Text>
                    <TextInput
                        style={styles.input}
                        value={raza}
                        onChangeText={setRaza}
                        placeholder="Mestizo"
                        placeholderTextColor={colors.secondary}
                    />

                    <Text style={styles.label}>Edad</Text>
                    <View style={styles.chips}>
                        {EDADES.map((item) => (
                            <Chip
                                key={item.label}
                                label={item.label}
                                activo={edad === item.value}
                                onPress={() => setEdad(item.value)}
                            />
                        ))}
                    </View>

                    <Text style={styles.label}>Sexo</Text>
                    <View style={styles.chips}>
                        {SEXOS.map((item) => (
                            <Chip
                                key={item}
                                label={item}
                                activo={sexo === item}
                                onPress={() => setSexo(item)}
                            />
                        ))}
                    </View>

                    <Text style={styles.label}>Descripción</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={descripcion}
                        onChangeText={setDescripcion}
                        placeholder="Contá la historia..."
                        placeholderTextColor={colors.secondary}
                        multiline
                    />

                    <Pressable
                        style={[
                            styles.submit,
                            publicando && styles.submitDisabled,
                        ]}
                        onPress={handlePublicar}
                        disabled={publicando}
                    >
                        {publicando ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.submitText}>Publicar</Text>
                        )}
                    </Pressable>
            </FormularioScroll>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 40 },
    back: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    backText: { color: colors.primary, fontWeight: '600' },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.primary,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 13,
        color: colors.secondary,
        textAlign: 'center',
        marginBottom: 16,
        marginTop: 4,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
        marginBottom: 6,
        marginTop: 8,
    },
    photoBox: {
        height: 180,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.soft,
        marginVertical: 8,
    },
    photo: { width: '100%', height: '100%' },
    photoPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    photoText: { color: colors.secondary },
    input: {
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.soft,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        color: colors.primary,
        marginBottom: 4,
    },
    textArea: { minHeight: 110, textAlignVertical: 'top' },
    chips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 4,
    },
    chip: {
        backgroundColor: colors.soft,
        padding: 10,
        borderRadius: 20,
    },
    chipActive: {
        backgroundColor: colors.primary,
    },
    chipText: { color: colors.primary, fontSize: 14 },
    chipTextActive: { color: '#FFFFFF', fontWeight: '600' },
    submit: {
        marginTop: 20,
        backgroundColor: colors.primary,
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
    },
    submitDisabled: { opacity: 0.7 },
    submitText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});
