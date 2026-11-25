import { useState, useEffect } from 'react';
import { Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animal from '../../components/animal';
import { getAnimales } from '../../services/animales';
import { useFavoritos } from '../../context/favoritosContext';

export default function Favoritos() {
    const [animales, setAnimales] = useState([]);
    const { favoritos } = useFavoritos();

    useEffect(() => {
        getAnimales().then(animales => {
            setAnimales(animales);
        })
        .catch(error => {
            console.log('Error al obtener animales:', error);
        });
    }, []);

    const animalesFavoritos = animales.filter((animal) =>
        favoritos.some((id) => String(id) === String(animal.id))
    );

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Mis favoritos</Text>

            {animalesFavoritos.length === 0 ? (
                <Text style={styles.message}>
                    Todavía no tenés animales favoritos.
                </Text>
            ) : (
                <FlatList
                    data={animalesFavoritos}
                    renderItem={({ item }) => (
                        <Animal animal={item} />
                    )}
                    keyExtractor={item => item.id.toString()}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5EEE7',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#795548',
        textAlign: 'center',
        margin: 16,
    },
    message: {
        textAlign: 'center',
        color: '#8A776B',
        marginTop: 30,
        fontSize: 16,
    },
});