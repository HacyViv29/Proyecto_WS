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
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

// 1. LEER DATOS DEL POST (Tal cual lo manda tu Python)
$input = file_get_contents("php://input");
$data = json_decode($input, true);

if (!$data || !isset($data["categoria"]) || !isset($data["accion"])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Datos inválidos"]);
    exit;
}

$categoria = $data["categoria"];
$accion = $data["accion"];
$isbn = $data["isbn"] ?? null;
$nombre = $data["nombre"] ?? null;
$nuevo_usuario = $data["nuevo_usuario"] ?? null;

// 2. CONFIGURACIÓN DE LLAMADAS AL MICROSERVICIO DE DATOS
// Usamos 127.0.0.1 para evitar bloqueos de DNS en XAMPP
$BASE = "http://127.0.0.1/Servicios%20Web/Proyecto%20Final/backend/suscripcionesWS/WS_suscripciones.php";

// Función robusta para llamar al otro servicio
function call_service($method, $url, $payload = null) {
    $curl = curl_init();
    $opts = [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 4, // Timeout corto para no colgar a Python
    ];
    if ($method === 'POST') {
        $opts[CURLOPT_POST] = true;
        $opts[CURLOPT_POSTFIELDS] = json_encode($payload);
        $opts[CURLOPT_HTTPHEADER] = ['Content-Type: application/json'];
    }
    curl_setopt_array($curl, $opts);
    $response = curl_exec($curl);
    curl_close($curl);
    return json_decode($response, true);
}

// 3. OBTENER SUSCRIPTORES (GET)
$respSuscripciones = call_service('GET', $BASE . "/suscripciones");

if (!$respSuscripciones || !isset($respSuscripciones['data']['suscripciones'])) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "No se pudo obtener la lista de suscriptores"]);
    exit;
}

$suscripciones = $respSuscripciones['data']['suscripciones'];
$notificados = [];
$titulo = "";
$mensaje = "";

// 4. LÓGICA DE FILTRADO (Tu lógica original)

// Caso A: Nuevo Usuario
if ($accion === "nuevo_usuario" && $nuevo_usuario) {
    $titulo = "Nuevo Usuario";
    $mensaje = "Se ha unido un nuevo miembro: $nuevo_usuario";

    foreach ($suscripciones as $usuario => $subs) {
        // Evitar notificarse a sí mismo (comparando limpio)
        $u_clean = str_replace(',', '.', $usuario);
        $n_clean = str_replace(',', '.', $nuevo_usuario);
        
        if ($u_clean === $n_clean) continue;

        if (!empty($subs["usuarios"])) {
            $notificados[] = $usuario;
        }
    }
}
// Caso B: Nuevo Contenido
else {
    $titulo = "Nuevo en " . ucfirst($categoria);
    $nombreShow = $nombre ?? "Contenido";
    $mensaje = "Se ha añadido: $nombreShow";

    foreach ($suscripciones as $usuario => $subs) {
        if (!empty($subs[$categoria])) {
            $notificados[] = $usuario;
        }
    }
}

// 5. ENVIAR A GUARDAR (POST a Suscripciones)
// Aquí es donde el webhook le dice a suscripciones: "Guarda esto en la BD"
if (!empty($notificados)) {
    $payloadGuardar = [
        'destinatarios' => $notificados,
        'datos' => [
            'titulo' => $titulo,
            'mensaje' => $mensaje,
            'categoria' => $categoria,
            'fecha' => date('Y-m-d H:i:s'),
            'leido' => false,
            'isbn' => $isbn
        ]
    ];

    // Llamada interna para persistir los datos
    call_service('POST', $BASE . "/notificaciones/guardar", $payloadGuardar);
}

echo json_encode([
    "success" => true,
    "message" => "Notificaciones procesadas",
    "total" => count($notificados),
    "notificados" => $notificados
]);
?>
