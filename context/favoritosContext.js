import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { getStoredSession } from '../services/authService';
import {
    agregarFavorito,
    getFavoritos,
    quitarFavorito,
} from '../services/favoritos';

const favoritosVacios = {
    favoritos: [],
    toggleFavorito: async () => {},
    esFavorito: () => false,
    recargarFavoritos: async () => {},
};

const favoritosContext = createContext(favoritosVacios);

const mismoId = (a, b) => String(a) === String(b);

export const FavoritosProvider = ({ children }) => {
    const [favoritos, setFavoritos] = useState([]);
    const pendientes = useRef(new Set());

    const recargarFavoritos = useCallback(async () => {
        const sesion = await getStoredSession();
        if (!sesion) {
            setFavoritos([]);
            return;
        }

        const lista = await getFavoritos();
        setFavoritos(lista);
    }, []);

    useEffect(() => {
        recargarFavoritos().catch((error) => {
            console.log('No se pudieron cargar los favoritos:', error);
        });
    }, [recargarFavoritos]);

    const toggleFavorito = async (idAnimal) => {
        const id = String(idAnimal);
        if (pendientes.current.has(id)) return;

        const yaEsta = favoritos.some((item) => mismoId(item, id));
        pendientes.current.add(id);

        try {
            const lista = yaEsta
                ? await quitarFavorito(id)
                : await agregarFavorito(id);
            setFavoritos(lista);
        } catch (error) {
            console.log('No se pudo actualizar el favorito:', error);
        } finally {
            pendientes.current.delete(id);
        }
    };

    const esFavorito = (idAnimal) =>
        favoritos.some((item) => mismoId(item, idAnimal));

    return (
        <favoritosContext.Provider
            value={{ favoritos, toggleFavorito, esFavorito, recargarFavoritos }}
        >
            {children}
        </favoritosContext.Provider>
    );
};

export const useFavoritos = () => {
    return useContext(favoritosContext) ?? favoritosVacios;
};
