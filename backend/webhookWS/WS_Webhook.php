<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
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

    // IMPORTANTÍSIMO: si tu endpoint es /suscripciones
    // este es el ÚNICO formato que Slim acepta SIN 404
    $url = $BASE . "/suscripciones" . $endpoint;

    $result = @file_get_contents($url);

    if ($result === false) {
        return null; // Para evitar warnings
    }

    return json_decode($result, true);
}

/* ==========================================================
   4. Caso especial: nuevo usuario (notificar a quienes tengan 'usuarios')
   ========================================================== */

if ($accion === "nuevo_usuario" && $nuevo_usuario) {

    // Obtener TODAS las suscripciones:
    $usuariosData = ms_get("");

    if (!$usuariosData || !isset($usuariosData["data"])) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "No se pudieron obtener las suscripciones del microservicio"
        ]);
        exit;
    }

    $notificados = [];

    foreach ($usuariosData["data"] as $usuarioInfo) {
        $usuario = $usuarioInfo["usuario"];

        if ($usuario === $nuevo_usuario) continue;

        if (!empty($usuarioInfo["suscripciones"]["usuarios"])) {
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
   5. Caso: nuevo contenido (libros, periódicos, revistas)
   ========================================================== */

$dataSuscripciones = ms_get("");

if (!$dataSuscripciones || !isset($dataSuscripciones["data"])) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "No se pudo obtener la lista de suscriptores"
    ]);
    exit;
}

$notificados = [];

foreach ($dataSuscripciones["data"] as $usuarioInfo) {
    if (!empty($usuarioInfo["suscripciones"][$categoria])) {
        $notificados[] = $usuarioInfo["usuario"];
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