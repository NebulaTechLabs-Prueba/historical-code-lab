// API Reference: https://www.wix.com/velo/reference/api-overview/introduction
// “Hello, World!” Example: https://learn-code.wix.com/en/article/hello-world

import { obtenerApiKey } from "backend/testback";
import { obtenerRutaDesdeUbicacion } from "backend/testback";
import wixWindow from "wix-window";

$w.onReady( async function () {
  console.log("Página Blanca Pruebas lista - Frontend");

  // Botón 1: Verificar comunicación con backend
  $w("#botonBackend").onClick(async () => {
    try {
      const apiKey = await obtenerApiKey();
      console.log("Comunicación con backend exitosa. API Key:", apiKey);
      $w("#textoEstado").text = "Backend OK: " + apiKey;
    } catch (error) {
      console.error("Error comunicando con backend:", error);
      $w("#textoEstado").text = "Error backend";
    }
  });

  // Al cargar la página, pasar la API Key al HTML Component para inicializar el mapa JS interactivo
  obtenerApiKey().then((apiKey) => {
    $w("#htmlMapa").postMessage({ apiKey });
  });

  // Botón 2: Pedir al HTML Component que centre el mapa en la ubicación del navegador y añada marcador
  $w("#botonUbicacion").onClick(async () => {
    $w("#textoEstado").text = "Buscando ubicación del navegador...";
    try {
      const position = await wixWindow.getCurrentGeolocation();
      if (position && position.coords) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        $w("#htmlMapa").postMessage({ action: "centrarEnUbicacion", lat, lng });
        $w("#textoEstado").text = `Ubicación mostrada: ${lat}, ${lng}`;
      } else {
        $w("#textoEstado").text = "No se pudo obtener la ubicación";
      }
    } catch (error) {
      $w("#textoEstado").text = "No se pudo obtener la ubicación";
    }
  });

  let clickCounter = 0;
  // Escucha mensajes desde el iFrame del mapa (ej: cuando el usuario hace clic en un destino)
  $w("#htmlMapa").onMessage(async (event) => {
    clickCounter++;
    console.log(`----------\nVelo (Intento #${clickCounter}): Mensaje recibido desde iFrame.`);
    console.log(`Velo (Intento #${clickCounter}): Objeto event.data crudo recibido:`, JSON.stringify(event.data));
    
    const { action, lat, lng } = event.data;

    if (action === "destinoSeleccionado") {
      console.log(`Velo (Intento #${clickCounter}): Acción 'destinoSeleccionado' reconocida.`);
      $w("#textoEstado").text = `Calculando ruta (intento ${clickCounter})...`;

      try {
        // 1. Obtener la ubicación ACTUAL del usuario como origen
        const position = await wixWindow.getCurrentGeolocation();
        const origen = `${position.coords.latitude},${position.coords.longitude}`;
        const destino = `${lat},${lng}`;
        console.log(`Velo (Intento #${clickCounter}): Origen: ${origen}, Destino: ${destino}`);

        // 2. Llamar a la función del backend para obtener la ruta
        console.log(`Velo (Intento #${clickCounter}): Llamando a obtenerRutaDesdeUbicacion...`);
        const ruta = await obtenerRutaDesdeUbicacion(origen, destino);
        console.log(`Velo (Intento #${clickCounter}): Ruta recibida desde backend.`);

        if (ruta && ruta.polyline) {
          const infoRuta = `<strong>Distancia:</strong> ${ruta.distance.text}<br><strong>Duración:</strong> ${ruta.duration.text}`;
          
          // 3. Enviar un objeto completo al iFrame para que dibuje la ruta y muestre el InfoWindow
          console.log(`Velo (Intento #${clickCounter}): Enviando datos de ruta e InfoWindow al iFrame.`);
          $w("#htmlMapa").postMessage({
            action: "dibujarRutaConInfo", // Nueva acción más descriptiva
            polyline: ruta.polyline,
            info: infoRuta,
            destino: { lat, lng }
          });

          // 4. También actualizamos el texto en la página de Velo (usamos .html para renderizar las etiquetas <strong> y <br>)
          $w("#textoEstado").html = infoRuta;
          console.log(`Velo (Intento #${clickCounter}): ${infoRuta.replace(/<br>/g, " ").replace(/<strong>/g, "").replace(/<\/strong>/g, "")}`);
        } else {
          throw new Error("La función del backend no devolvió una ruta válida.");
        }
      } catch (error) {
        console.error(`Velo (Intento #${clickCounter}): Error al obtener y dibujar la ruta:`, error);
        $w("#textoEstado").text = `Error al calcular la ruta (intento ${clickCounter}).`;
      }
    }
  });
});
