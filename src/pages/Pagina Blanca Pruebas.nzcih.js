// API Reference: https://www.wix.com/velo/reference/api-overview/introduction
// “Hello, World!” Example: https://learn-code.wix.com/en/article/hello-world

import { obtenerApiKey } from 'backend/maps';

$w.onReady(function () {
  $w("#btnObtenerApiKey").onClick(() => {
    obtenerApiKey()
      .then((clave) => {
        console.log("API Key obtenida:", clave);
      })
      .catch((error) => {
        console.error("Error al obtener la API Key:", error);
      });
  });
});