// API Reference: https://www.wix.com/velo/reference/api-overview/introduction
// “Hello, World!” Example: https://learn-code.wix.com/en/article/hello-world

import { obtenerApiKey } from 'backend/maps';

$w.onReady(function () {
  $w("#btnObtenerApiKey").onClick(() => {
    obtenerApiKey().then(({ apiKey, backendMsg }) => {
      console.log(backendMsg); // Muestra el mensaje del backend
      $w("#textApiKey").text = `Clave API: ${apiKey}`; // Muestra la clave API en el elemento de texto
    }).catch((error) => {
      console.error("Error al obtener la clave API:", error);
      $w("#textApiKey").text = "Error al obtener la clave API.";
    });
  });
});