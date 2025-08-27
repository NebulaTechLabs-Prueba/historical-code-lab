// API Reference: https://www.wix.com/velo/reference/api-overview/introduction
import { obtenerApiKey } from "backend/testback";
import { obtenerRutaDesdeUbicacion } from "backend/testback";
import wixWindow from "wix-window";

$w.onReady(function () {
    console.log("Velo: $w.onReady ejecutado.");
    console.log("Página Blanca Pruebas lista - Frontend");
    let clickCounter = 0;

    // --- LÓGICA PARA REPETIDOR DE PARADAS (CON ELEMENTOS AddressInput) ---
    let paradasData = [];
    let paradaIdCounter = 0;

    function inicializarParadas() {
        paradaIdCounter = 1;
        // El objeto de dirección empieza nulo. El placeholder se controla en el editor de Wix.
        const primeraParada = { _id: 'parada-1', direccionObject: null };
        paradasData = [primeraParada];
        $w('#repetidorParadas').data = paradasData;
        $w('#textoEstado').text = "Listo para iniciar una nueva ruta.";
    }

    $w("#repetidorParadas").onItemReady(($item, itemData, index) => {
        console.log(`Velo: onItemReady para repetidorParadas - ${itemData._id}`);
        // Asignamos el valor al AddressInput. Si es nulo, se mostrará el placeholder.
        $item("#inputParada").value = itemData.direccionObject;

        // El botón de quitar parada
        $item("#botonQuitarParada").onClick(() => {
            if (paradasData.length > 1) {
                paradasData = paradasData.filter(p => p._id !== itemData._id);
                $w("#repetidorParadas").data = paradasData;
            } else {
                // Si es el último, lo vaciamos actualizando el dato y el componente
                paradasData = [{ ...paradasData[0], direccionObject: null }];
                $item("#inputParada").value = null; // Limpiamos el AddressInput
                $w("#repetidorParadas").data = paradasData;
                $w("#textoEstado").text = "Se ha vaciado la parada.";
            }
        });

        // Usamos onChange, que se dispara cuando el usuario selecciona una dirección válida.
        $item("#inputParada").onChange((event) => {
            const nuevaDireccion = event.target.value;
            paradasData = paradasData.map(p =>
                p._id === itemData._id ? { ...p, direccionObject: nuevaDireccion } : p
            );
        });
    });

    $w("#botonAnadirParada").onClick(() => {
        console.log("Velo: botonAnadirParada click.");
        const ultimaParada = paradasData[paradasData.length - 1];
        // Regla modificada: Comprueba si el objeto de dirección de la última parada es nulo.
        if (paradasData.length > 1 && !ultimaParada.direccionObject) {
            $w("#textoEstado").text = "Por favor, rellena la última parada antes de añadir una nueva.";
            return;
        }

        paradaIdCounter++;
        const nuevoId = `parada-${paradaIdCounter}`;
        const nuevaParada = { _id: nuevoId, direccionObject: null };
        paradasData = [...paradasData, nuevaParada];
        $w("#repetidorParadas").data = paradasData;
    });
    // --- FIN DE LÓGICA DEL REPETIDOR ---


    // --- CONFIGURACIÓN DE EVENTOS ---
    $w("#botonLimpiar").onClick(() => {
        console.log("Velo: botonLimpiar click.");
        $w("#direccionInput").value = null; // Limpiamos el AddressInput de destino
        inicializarParadas();
        $w("#htmlMapa").postMessage({ action: "limpiarMapa" });
        clickCounter = 0;
    });

        $w("#botonRuta").onClick(async () => {
        console.log("Velo: botonRuta click.");
        const direccionDestino = $w("#direccionInput").value;

        // Verificación final: nos aseguramos de tener coordenadas de ubicación.
        if (!$w("#direccionInput").valid || !direccionDestino || !direccionDestino.location) {
            $w("#textoEstado").text = "Por favor, selecciona una dirección de destino válida de la lista.";
            return;
        }

        // Extraemos las coordenadas para el destino.
        const destinoCoordsString = `${direccionDestino.location.latitude},${direccionDestino.location.longitude}`;

        // Extraemos las coordenadas para las paradas.
        const waypointsCoords = paradasData
            .map(parada => {
                if (parada.direccionObject && parada.direccionObject.location) {
                    return `${parada.direccionObject.location.latitude},${parada.direccionObject.location.longitude}`;
                }
                return null;
            })
            .filter(coords => coords) // Filtramos las paradas nulas
            .join('|');

        $w("#textoEstado").text = `Buscando ruta para: ${direccionDestino.formatted}...`;
        // Enviamos las coordenadas al backend.
        await manejarCalculoRuta({ destinoString: destinoCoordsString, waypoints: waypointsCoords });
    });

    $w("#botonBackend").onClick(async () => {
        console.log("Velo: botonBackend click.");
        try {
            const apiKey = await obtenerApiKey();
            console.log("Comunicación con backend exitosa. API Key:", apiKey);
            $w("#textoEstado").text = "Backend OK";
        } catch (error) {
            console.error("Error comunicando con backend:", error);
            $w("#textoEstado").text = "Error backend";
        }
    });

    $w("#botonUbicacion").onClick(async () => {
        console.log("Velo: botonUbicacion click.");
        $w("#textoEstado").text = "Buscando ubicación del navegador...";
        try {
            const position = await wixWindow.getCurrentGeolocation();
            if (position && position.coords) {
                const { latitude, longitude } = position.coords;
                $w("#htmlMapa").postMessage({ action: "centrarEnUbicacion", lat: latitude, lng: longitude });
                $w("#textoEstado").text = `Ubicación actual: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            } else {
                $w("#textoEstado").text = "No se pudo obtener la ubicación.";
            }
        } catch (error) {
            $w("#textoEstado").text = "Error al obtener la ubicación.";
        }
    });

    $w("#htmlMapa").onMessage(async (event) => {
        console.log("Velo: htmlMapa onMessage.");
        const { action, lat, lng } = event.data;
        if (action === "destinoSeleccionado") {
            await manejarCalculoRuta({ destinoCoords: { lat, lng } });
        }
    });

    // --- LÓGICA PRINCIPAL ---
    async function manejarCalculoRuta(config) {
        clickCounter++;
        const { destinoCoords, destinoString, waypoints } = config;
        const logPrefix = `Velo (Intento #${clickCounter}):`;

        console.log(`----------
${logPrefix} Iniciando cálculo de ruta.`);

        try {
            const position = await wixWindow.getCurrentGeolocation();
            const origen = `${position.coords.latitude},${position.coords.longitude}`;
            const destinoParaApi = destinoString || `${destinoCoords.lat},${destinoCoords.lng}`;

            console.log(`${logPrefix} Origen: ${origen}, Destino: ${destinoParaApi}, Paradas: ${waypoints || 'ninguna'}`);

            const ruta = await obtenerRutaDesdeUbicacion(origen, destinoParaApi, waypoints);
            console.log(`${logPrefix} Ruta recibida desde backend.`);

            if (ruta && ruta.polyline) {
                const infoRuta = `<strong>Distancia Total:</strong> ${ruta.distance.text}<br><strong>Duración Total:</strong> ${ruta.duration.text}`;
                const coordsDestinoFinal = destinoCoords || ruta.end_location;

                console.log(`${logPrefix} Enviando datos de ruta e InfoWindow al iFrame.`);
                $w("#htmlMapa").postMessage({
                    action: "dibujarRutaConInfo",
                    polyline: ruta.polyline,
                    info: infoRuta,
                    destino: coordsDestinoFinal
                });

                $w("#textoEstado").html = infoRuta;
                console.log(`${logPrefix} ${infoRuta.replace(/<br>/g, " ").replace(/<strong>/g, "").replace(/<\/strong>/g, "")}`);
            } else {
                $w("#textoEstado").text = "No se encontraron rutas para el destino proporcionado.";
                throw new Error("La función del backend no devolvió una ruta válida.");
            }
        } catch (error) {
            console.error(`${logPrefix} Error en el flujo de cálculo de ruta:`, error);
            $w("#textoEstado").text = "Error al calcular la ruta.";
        }
    }

    // Inicialización al cargar la página
    inicializarParadas();

    obtenerApiKey().then((apiKey) => {
        $w("#htmlMapa").postMessage({ apiKey });
    }).catch(err => {
        console.error("Error al obtener la API Key en la carga inicial:", err);
        $w("#textoEstado").text = "Error de configuración: no se pudo cargar la API Key.";
    });
});