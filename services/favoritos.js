import { apiRequest } from './api';

const comoLista = (data) => {
    const lista = Array.isArray(data?.favoritos) ? data.favoritos : [];
    return lista.map((id) => String(id));
};

export async function getFavoritos() {
    const data = await apiRequest('/api/users/favoritos');
    return comoLista(data);
}

export async function agregarFavorito(idAnimal) {
    const data = await apiRequest(`/api/users/favoritos/${idAnimal}`, {
        method: 'POST',
    });
    return comoLista(data);
}

export async function quitarFavorito(idAnimal) {
    const data = await apiRequest(`/api/users/favoritos/${idAnimal}`, {
        method: 'DELETE',
    });
    return comoLista(data);
}
