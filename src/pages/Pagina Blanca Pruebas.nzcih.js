// API Reference: https://www.wix.com/velo/reference/api-overview/introduction
// “Hello, World!” Example: https://learn-code.wix.com/en/article/hello-world

import { obtenerApiKey } from 'backend/maps';

$w.onReady(function () {
    console.log("Página lista, llamando a backend para obtener clave API...");
    console.log(obtenerApiKey());
  $w("#botonPrueba").onClick(() => {
      console.log("Botón clickeado, llamando a backend...");
    $w("#textoPrueba").text = "Obteniendo clave API...";
  });
});