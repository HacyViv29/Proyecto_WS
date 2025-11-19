<?php

// ===============================
// CONFIGURACIÓN
// ===============================
$project = "conectabuapws-default-rtdb";
$path = "Suscripciones/pruebas1.json";   // Ruta única a revisar
$url = "https://{$project}.firebaseio.com/{$path}";

// Archivo local donde guardamos el último estado
$state_file = "last_state.json";


// ===============================
// FUNCIÓN: Obtener datos desde Firebase
// ===============================
function get_firebase($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

    $resp = curl_exec($ch);
    curl_close($ch);

    return json_decode($resp, true);
}


// ===============================
// FUNCIÓN: Enviar notificación
// ===============================
function notify_change($key) {
    // Aquí puedes enviar correo, webhook externo, guardar log, etc.
    echo "Nueva suscripción activada: {$key}<br>";
}


// ===============================
// PASO 1: Leer estado actual de Firebase
// ===============================
$current = get_firebase($url);

if ($current === null) {
    echo "Error obteniendo datos de Firebase";
    exit;
}


// ===============================
// PASO 2: Leer el último estado guardado
// ===============================
if (file_exists($state_file)) {
    $last_state = json_decode(file_get_contents($state_file), true);
} else {
    $last_state = [];
}


// ===============================
// PASO 3: Comparar cambios (true nuevo)
// ===============================
foreach ($current as $key => $value) {
    $old = $last_state[$key] ?? false;

    // Si antes no existía o era false → y ahora es true
    if ($value === true && $old !== true) {
        notify_change($key);
    }
}


// ===============================
// PASO 4: Guardar nuevo estado
// ===============================
file_put_contents($state_file, json_encode($current));

echo "Webhook procesado correctamente";

?>
