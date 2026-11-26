import { useFavoritos as usarFavoritos } from '../context/favoritosContext';

export function useFavoritos() {
    if (typeof usarFavoritos !== 'function') {
        return {
            favoritos: [],
            toggleFavorito: async () => {},
            esFavorito: () => false,
            recargarFavoritos: async () => {},
        };
    }

    return usarFavoritos();
}
