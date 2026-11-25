/**
 * Normaliza IDs que vienen de MongoDB (_id / ObjectId / { $oid }).
 */
export function toCoord(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
        const numero = Number(value);
        if (Number.isFinite(numero)) return numero;
    }
    return null;
}

export function normalizeId(value) {
    if (value == null) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'object') {
        if (value.$oid) return String(value.$oid);
        if (typeof value.toHexString === 'function') {
            return value.toHexString();
        }
        if (typeof value.toString === 'function') {
            const asString = value.toString();
            if (asString && asString !== '[object Object]') {
                return asString;
            }
        }
    }
    return String(value);
}

export function normalizeUser(user) {
    if (!user) return null;

    const id = normalizeId(user.id ?? user._id ?? user.userId);

    return {
        ...user,
        id,
        _id: undefined,
        telefono: user.telefono || '',
        ubicacion: user.ubicacion || user.direccion || '',
        direccion: user.direccion || user.ubicacion || '',
        latitude: toCoord(user.latitude),
        longitude: toCoord(user.longitude),
    };
}

export function normalizeAnimal(animal) {
    if (!animal) return null;

    const id = normalizeId(animal.id ?? animal._id);
    const userId = normalizeId(animal.user_id ?? animal.idUsuario);

    return {
        ...animal,
        id,
        user_id: userId,
        idUsuario: userId,
        adoptado: Boolean(animal.adoptado),
        estado: animal.estado || (animal.adoptado ? 'Adoptado' : 'En adopción'),
    };
}

export function normalizePosteo(posteo) {
    if (!posteo) return null;

    const id = normalizeId(posteo.id ?? posteo._id);
    const animalId = normalizeId(posteo.animal_id ?? posteo.idAnimal);
    const userId = normalizeId(posteo.user_id ?? posteo.idUsuario);

    let fecha = posteo.fecha;
    if (fecha && typeof fecha !== 'string') {
        try {
            fecha = new Date(fecha).toLocaleDateString('es-AR');
        } catch {
            fecha = String(posteo.fecha);
        }
    } else if (typeof fecha === 'string' && fecha.includes('T')) {
        try {
            fecha = new Date(fecha).toLocaleDateString('es-AR');
        } catch {
            // keep raw
        }
    }

    return {
        ...posteo,
        id,
        animal_id: animalId,
        idAnimal: animalId,
        user_id: userId,
        idUsuario: userId,
        fecha,
    };
}
