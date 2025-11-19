<?php

$project = "conectabuapws-default-rtdb";

$rutas = [
    "Suscripciones/pruebas1/libros",
    "Suscripciones/pruebas1/periodicos",
    "Suscripciones/pruebas1/revistas",
    "Suscripciones/pruebas1/usuarios"
];

// Archivo local donde guardar último estado
$cacheFile = "firebase_cache.json";

// Si no existe el archivo cache, crear vacío
if (!file_exists($cacheFile)) {
    file_put_contents($cacheFile, json_encode([]));
}

$cache = json_decode(file_get_contents($cacheFile), true);

foreach ($rutas as $ruta) {

    $data = firebase_get($project, $ruta);

    // Si no hay datos, saltar
    if ($data === null) continue;

    // Si no existe en cache → inicializar
    if (!isset($cache[$ruta])) {
        $cache[$ruta] = $data;
    }

    // Detectar cambios (true/false)
    if ($cache[$ruta] !== $data) {

        echo "CAMBIO detectado en: $ruta\n";
        echo "Valor anterior: " . var_export($cache[$ruta], true) . "\n";
        echo "Valor nuevo: " . var_export($data, true) . "\n";
        echo "------------------------\n";

        // Aquí puedes agregar:
        // enviar correo, webhook a otro sitio, log, etc.
    }

    // Actualizar cache
    $cache[$ruta] = $data;
}

// Guardar cache actualizado
file_put_contents($cacheFile, json_encode($cache, JSON_PRETTY_PRINT));


// ---------- FUNCIONES ----------

function firebase_get($project, $path) {
    $url = "https://$project.firebaseio.com/$path.json";

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

    $response = curl_exec($ch);
    curl_close($ch);

    return json_decode($response, true);
}

?>
