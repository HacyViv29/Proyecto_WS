<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "message" => "Solo se permiten solicitudes POST"
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Método no permitido. Use POST"
    ]);
    exit;
}

/* ==========================================================
   1. Leer información del POST
   ========================================================== */
$input = file_get_contents("php://input");
$data = json_decode($input, true);

if (!$data || !isset($data["categoria"]) || !isset($data["accion"])) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Datos inválidos. Se requieren 'categoria' y 'accion'"
    ]);
    exit;
}

$categoria = $data["categoria"];
$accion = $data["accion"];
$isbn = $data["isbn"] ?? null;
$nombre = $data["nombre"] ?? null;
$nuevo_usuario = $data["nuevo_usuario"] ?? null;

/* ==========================================================
   2. URL DEL MICROSERVICIO DE SUSCRIPCIONES
   ========================================================== */
$BASE = "http://localhost/Servicios%20Web/Proyecto%20Final/backend/suscripcionesWS/WS_suscripciones.php";

/* ==========================================================
   3. FUNCION para llamar al microservicio correctamente
   ========================================================== */
function ms_get($endpoint) {
    global $BASE;
    $url = $BASE . "/suscripciones" . $endpoint;

    $result = @file_get_contents($url);

    if ($result === false) {
        return null;
    }

    return json_decode($result, true);
}

/* ==========================================================
   4. Caso especial: NUEVO USUARIO
   ========================================================== */
if ($accion === "nuevo_usuario" && $nuevo_usuario) {

    $usuariosData = ms_get("");

    if (!$usuariosData || !isset($usuariosData["data"]["suscripciones"])) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "No se pudieron obtener las suscripciones del microservicio"
        ]);
        exit;
    }

    $suscripciones = $usuariosData["data"]["suscripciones"];
    $notificados = [];

    foreach ($suscripciones as $usuario => $subs) {

        if ($usuario === $nuevo_usuario) continue;

        // Notificar solo a usuarios con suscripción "usuarios"
        if (!empty($subs["usuarios"])) {
            $notificados[] = $usuario;
        }
    }

    echo json_encode([
        "success" => true,
        "message" => "Notificaciones procesadas (nuevo usuario)",
        "accion" => "nuevo_usuario",
        "nuevo_usuario" => $nuevo_usuario,
        "notificados" => $notificados,
        "total" => count($notificados)
    ]);
    exit;
}

/* ==========================================================
   5. Caso: NUEVO CONTENIDO (libros, periódicos, revistas)
   ========================================================== */

$dataSuscripciones = ms_get("");

if (!$dataSuscripciones || !isset($dataSuscripciones["data"]["suscripciones"])) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "No se pudo obtener la lista de suscriptores"
    ]);
    exit;
}

$suscripciones = $dataSuscripciones["data"]["suscripciones"];
$notificados = [];

foreach ($suscripciones as $usuario => $subs) {

    // Si esa categoría está activa para el usuario → se notifica
    if (!empty($subs[$categoria])) {
        $notificados[] = $usuario;
    }
}

echo json_encode([
    "success" => true,
    "message" => "Notificaciones procesadas (nuevo contenido)",
    "categoria" => $categoria,
    "accion" => $accion,
    "isbn" => $isbn,
    "nombre" => $nombre,
    "notificados" => $notificados,
    "total" => count($notificados)
]);
