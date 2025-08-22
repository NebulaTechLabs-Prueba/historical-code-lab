// API Reference: https://www.wix.com/velo/reference/api-overview/introduction
// “Hello, World!” Example: https://learn-code.wix.com/en/article/hello-world

import { obtenerApiKey } from 'backend/testback';

$w.onReady(async function () {
  console.log("Página Blanca Pruebas lista - Frontend");
  try {
    const apiKey = await obtenerApiKey();
    const url = `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=-33.8688,151.2093&zoom=10`;
    $w("#htmlMapa").src = url; // Si el HTML Component lo permite
// O bien:
$w("#htmlMapa").postMessage(`<iframe width="100%" height="400" frameborder="0" style="border:0" allowfullscreen src="${url}"></iframe>`);
  } catch (error) {
    console.error("Error al obtener la clave API:", error);
    // Opcional: mostrar mensaje en un texto
    if ($w("#textApiKey")) {
      $w("#textApiKey").text = "Error al obtener la clave API";
    }
  }
});
