/**
 * Autocomplete de direcciones en Argentina vía Nominatim.
 * Las coordenadas salen de esa respuesta; no hay un listado local.
 *
 * El texto visible usa calle, localidad, provincia y país.
 * Quedan afuera el barrio, el número, el código postal y la comuna.
 */

const cacheDireccion = new Map();

const encabezadosNominatim = {
    Accept: 'application/json',
    'Accept-Language': 'es-AR,es;q=0.9',
    'User-Agent': 'MundoHuellitas/1.0 (proyecto-academico-ORT)',
};

const primeraParte = (...valores) => {
    for (const valor of valores) {
        const texto = String(valor || '').trim();
        if (texto) return texto;
    }
    return '';
};

export function resumirDireccion(address) {
    if (!address || typeof address !== 'object') return '';

    const calle = primeraParte(
        address.road,
        address.pedestrian,
        address.footway,
        address.path
    );
    const localidad = primeraParte(
        address.suburb,
        address.town,
        address.village,
        address.hamlet,
        address.city,
        address.municipality
    );
    const region = primeraParte(address.state);
    const pais = primeraParte(address.country);
    const partes = [];

    const agregar = (texto) => {
        const limpio = String(texto || '').trim();
        if (!limpio) return;

        const clave = limpio.toLowerCase();
        if (partes.some((parte) => parte.toLowerCase() === clave)) return;

        const regionClave = region.toLowerCase();
        if (
            clave === 'buenos aires' &&
            regionClave.includes('ciudad autónoma')
        ) {
            return;
        }

        partes.push(limpio);
    };

    agregar(calle);
    agregar(localidad);
    agregar(region);
    agregar(pais);

    return partes.join(', ');
}

const buscarNominatim = async (query) => {
    const params = new URLSearchParams({
        format: 'json',
        addressdetails: '1',
        limit: '5',
        countrycodes: 'ar',
        q: query,
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?${params.toString()}`,
            {
                signal: controller.signal,
                headers: encabezadosNominatim,
            }
        );

        if (!response.ok) {
            return [];
        }

        const data = await response.json();

        return data
            .map((item) => ({
                id: `osm-${item.place_id}`,
                label: resumirDireccion(item.address) || item.display_name,
                latitude: Number(item.lat),
                longitude: Number(item.lon),
                fuente: 'nominatim',
            }))
            .filter(
                (item) =>
                    Number.isFinite(item.latitude) &&
                    Number.isFinite(item.longitude)
            );
    } catch (error) {
        console.log('Nominatim no disponible:', error?.message);
        return [];
    } finally {
        clearTimeout(timeout);
    }
};

const buscarDireccionesArgentina = async (texto) => {
    const query = texto.trim();

    if (query.length < 3) {
        return [];
    }

    const remotas = await buscarNominatim(query);
    const vistos = new Set();
    const unicas = [];

    for (const item of remotas) {
        const key = item.label.toLowerCase();
        if (vistos.has(key)) continue;
        vistos.add(key);
        unicas.push(item);
    }

    return unicas.slice(0, 8);
};

const resolverCoordenadas = async ({ label, latitude, longitude }) => {
    if (
        typeof latitude === 'number' &&
        typeof longitude === 'number' &&
        Number.isFinite(latitude) &&
        Number.isFinite(longitude)
    ) {
        return { latitude, longitude, direccion: label };
    }

    const resultados = await buscarNominatim(label);

    if (!resultados.length) {
        throw new Error(
            'No pudimos obtener coordenadas para esa dirección. Elegí una sugerencia de la lista.'
        );
    }

    return {
        latitude: resultados[0].latitude,
        longitude: resultados[0].longitude,
        direccion: resultados[0].label,
    };
};

const reverseNominatim = async (latitude, longitude) => {
    const params = new URLSearchParams({
        format: 'json',
        addressdetails: '1',
        lat: String(latitude),
        lon: String(longitude),
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
            {
                signal: controller.signal,
                headers: encabezadosNominatim,
            }
        );

        if (!response.ok) return null;

        const data = await response.json();
        return data?.address || null;
    } catch (error) {
        console.log('Nominatim reverse no disponible:', error?.message);
        return null;
    } finally {
        clearTimeout(timeout);
    }
};

/**
 * Texto corto para mostrar. Si hay coordenadas, rearma la dirección
 * y no usa el texto largo que ya estaba guardado.
 */
const resumirUbicacionVisible = async ({ ubicacion, latitude, longitude }) => {
    const tieneCoords =
        typeof latitude === 'number' &&
        Number.isFinite(latitude) &&
        typeof longitude === 'number' &&
        Number.isFinite(longitude);

    if (!tieneCoords) return ubicacion || '';

    const clave = `${latitude.toFixed(5)},${longitude.toFixed(5)}`;
    if (cacheDireccion.has(clave)) return cacheDireccion.get(clave);

    const address = await reverseNominatim(latitude, longitude);
    const corta = resumirDireccion(address) || ubicacion || '';
    cacheDireccion.set(clave, corta);
    return corta;
};

export {
    buscarDireccionesArgentina,
    resolverCoordenadas,
    resumirUbicacionVisible,
};
