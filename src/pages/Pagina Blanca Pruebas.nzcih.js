// API Reference: https://www.wix.com/velo/reference/api-overview/introduction
// “Hello, World!” Example: https://learn-code.wix.com/en/article/hello-world


import { obtenerApiKey } from 'backend/testback';
import wixWindow from 'wix-window';

$w.onReady(function () {
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
  obtenerApiKey().then(apiKey => {
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
});
