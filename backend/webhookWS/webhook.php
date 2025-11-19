<?php
header("Content-Type: application/json");

// Ejecutar el webhook real
include "webhook_core.php";

echo json_encode([
    "status" => "ok",
    "message" => "Webhook ejecutado. Si hubo cambios en Firebase, se mostraron en la salida del servidor."
]);
