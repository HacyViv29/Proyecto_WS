<?php
header("Content-Type: application/json");

class FirebaseWebhook {
    private $project;
    private $cacheFile;
    private $cache;
    
    public function __construct($project = "conectabuapws-default-rtdb") {
        $this->project = $project;
        $this->cacheFile = "firebase_cache.json";
        $this->initializeCache();
    }
    
    private function initializeCache() {
        if (!file_exists($this->cacheFile)) {
            file_put_contents($this->cacheFile, json_encode([]));
        }
        $this->cache = json_decode(file_get_contents($this->cacheFile), true);
    }
    
    public function monitorChanges() {
        $rutas = [
            "Suscripciones/pruebas1/libros",
            "Suscripciones/pruebas1/periodicos", 
            "Suscripciones/pruebas1/revistas",
            "Suscripciones/pruebas1/usuarios"
        ];
        
        $changes = [];
        
        foreach ($rutas as $ruta) {
            $data = $this->firebaseGet($ruta);
            
            if ($data === null) continue;
            
            if (!isset($this->cache[$ruta])) {
                $this->cache[$ruta] = $data;
            }
            
            if ($this->cache[$ruta] !== $data) {
                $changes[] = [
                    'ruta' => $ruta,
                    'valor_anterior' => $this->cache[$ruta],
                    'valor_nuevo' => $data
                ];
                
                // Detectar si es un cambio a "true" (nuevo elemento agregado)
                if ($data === true) {
                    $categoria = $this->extraerCategoria($ruta);
                    $mensaje = $this->generarMensaje($categoria);
                    
                    // Notificar a todos los suscriptores de esta categoría
                    $this->notificarTodosCategoria($categoria, $mensaje);
                }
                
                $this->cache[$ruta] = $data;
            }
        }
        
        file_put_contents($this->cacheFile, json_encode($this->cache, JSON_PRETTY_PRINT));
        return $changes;
    }
    
    // Endpoint 1: Notificar a un usuario específico en una categoría
    public function notificarUsuario($usuario, $categoria) {
        // Verificar si el usuario está suscrito a la categoría
        $rutaSuscripcion = "Suscripciones/$usuario/$categoria";
        $estaSuscrito = $this->firebaseGet($rutaSuscripcion);
        
        if ($estaSuscrito !== true) {
            return [
                'success' => false,
                'message' => "El usuario $usuario no está suscrito a la categoría $categoria",
                'usuario' => $usuario,
                'categoria' => $categoria
            ];
        }
        
        $mensaje = $this->generarMensaje($categoria);
        
        // Enviar notificación al usuario
        $resultado = $this->enviarNotificacionIndividual($usuario, $categoria, $mensaje);
        
        return [
            'success' => true,
            'message' => "Notificación enviada a $usuario para categoría $categoria",
            'usuario' => $usuario,
            'categoria' => $categoria,
            'mensaje_notificacion' => $mensaje,
            'resultado' => $resultado
        ];
    }
    
    // Endpoint 2: Notificar a TODOS los usuarios suscritos a una categoría
    public function notificarTodosCategoria($categoria, $mensajePersonalizado = null) {
        // Obtener todos los usuarios suscritos a esta categoría
        $usuariosSuscriptos = $this->obtenerSuscriptoresPorCategoria($categoria);
        $notificacionesEnviadas = [];
        $notificacionesFallidas = [];
        
        $mensaje = $mensajePersonalizado ?: $this->generarMensaje($categoria);
        
        foreach ($usuariosSuscriptos as $usuario) {
            $resultado = $this->enviarNotificacionIndividual($usuario, $categoria, $mensaje);
            
            if ($resultado['success']) {
                $notificacionesEnviadas[] = $usuario;
            } else {
                $notificacionesFallidas[] = $usuario;
            }
        }
        
        return [
            'categoria' => $categoria,
            'mensaje' => $mensaje,
            'total_usuarios' => count($usuariosSuscriptos),
            'notificaciones_exitosas' => count($notificacionesEnviadas),
            'notificaciones_fallidas' => count($notificacionesFallidas),
            'usuarios_notificados' => $notificacionesEnviadas,
            'usuarios_fallidos' => $notificacionesFallidas
        ];
    }
    
    private function generarMensaje($categoria) {
        $mensajes = [
            'libros' => 'Nuevo libro agregado correctamente',
            'usuarios' => 'Nuevo usuario agregado correctamente', 
            'revistas' => 'Nueva revista agregada correctamente',
            'periodicos' => 'Nuevo periódico agregado correctamente'
        ];
        
        return $mensajes[$categoria] ?? "Nuevo $categoria agregado correctamente";
    }
    
    private function obtenerSuscriptoresPorCategoria($categoria) {
        // Obtener todos los usuarios de Firebase
        $usuariosData = $this->firebaseGet("Suscripciones");
        $suscriptores = [];
        
        if ($usuariosData && is_array($usuariosData)) {
            foreach ($usuariosData as $usuario => $suscripciones) {
                if (isset($suscripciones[$categoria]) && $suscripciones[$categoria] === true) {
                    $suscriptores[] = $usuario;
                }
            }
        }
        
        return $suscriptores;
    }
    
    private function enviarNotificacionIndividual($usuario, $categoria, $mensaje) {
        // Aquí implementas el método de notificación
        // Puede ser email, push notification, SMS, etc.
        
        // Por ahora, simulamos el envío y lo logueamos
        $logData = [
            'timestamp' => date('Y-m-d H:i:s'),
            'usuario' => $usuario,
            'categoria' => $categoria,
            'mensaje' => $mensaje,
            'tipo' => 'notificacion'
        ];
        
        // Guardar en log
        $this->guardarLog($logData);
        
        // Simular envío (reemplaza esto con tu método real)
        $exito = $this->simularEnvioNotificacion($usuario, $mensaje);
        
        return [
            'success' => $exito,
            'usuario' => $usuario,
            'mensaje' => $mensaje,
            'metodo' => 'simulado', // Cambia por 'email', 'push', etc.
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
    
    private function simularEnvioNotificacion($usuario, $mensaje) {
        // Simular envío de notificación
        // En producción, reemplaza con:
        // - Envío de email
        // - Push notification
        // - Webhook a otro servicio
        // - Mensaje a cola de procesamiento
        
        error_log("NOTIFICACIÓN: Para $usuario - $mensaje");
        
        // Simular éxito (90% de probabilidad)
        return rand(1, 10) <= 9;
    }
    
    private function guardarLog($data) {
        $logFile = "notificaciones.log";
        $logEntry = json_encode($data) . PHP_EOL;
        file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
    }
    
    private function extraerCategoria($ruta) {
        $partes = explode('/', $ruta);
        return end($partes);
    }
    
    private function firebaseGet($path) {
        $url = "https://{$this->project}.firebaseio.com/$path.json";
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            error_log("Error Firebase GET: $httpCode - $path");
            return null;
        }
        
        return json_decode($response, true);
    }
}

// --- PROCESAR LA SOLICITUD ---

$method = $_SERVER['REQUEST_METHOD'];
$webhook = new FirebaseWebhook();

if ($method === 'GET') {
    // Endpoint 1: Monitoreo de cambios (GET sin parámetros)
    $cambios = $webhook->monitorChanges();
    
    if (empty($cambios)) {
        echo json_encode([
            "status" => "ok",
            "message" => "No se detectaron cambios en Firebase",
            "timestamp" => date('Y-m-d H:i:s')
        ]);
    } else {
        echo json_encode([
            "status" => "changes_detected",
            "message" => "Se detectaron cambios en Firebase",
            "total_cambios" => count($cambios),
            "cambios" => $cambios,
            "timestamp" => date('Y-m-d H:i:s')
        ]);
    }
    
} elseif ($method === 'POST') {
    // Endpoints con POST y JSON
    
    // Obtener datos JSON del body
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    // Endpoint: Notificar a usuario específico
    if (isset($data['action']) && $data['action'] === 'notificar_usuario') {
        if (isset($data['usuario']) && isset($data['categoria'])) {
            $usuario = $data['usuario'];
            $categoria = $data['categoria'];
            
            $resultado = $webhook->notificarUsuario($usuario, $categoria);
            echo json_encode($resultado);
            exit;
        } else {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Faltan parámetros: usuario y categoria son requeridos'
            ]);
            exit;
        }
    }
    
    // Endpoint: Notificar a todos los usuarios de una categoría
    if (isset($data['action']) && $data['action'] === 'notificar_categoria') {
        if (isset($data['categoria'])) {
            $categoria = $data['categoria'];
            
            $resultado = $webhook->notificarTodosCategoria($categoria);
            echo json_encode($resultado);
            exit;
        } else {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Faltan parámetros: categoria es requerido'
            ]);
            exit;
        }
    }
    
    // Si es POST pero no tiene action válido
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Acción no válida. Use: notificar_usuario o notificar_categoria'
    ]);
    
} else {
    http_response_code(405);
    echo json_encode([
        "status" => "error",
        "message" => "Método no permitido. Use GET o POST"
    ]);
}
?>