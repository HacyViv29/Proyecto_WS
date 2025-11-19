<?php
require __DIR__ . '/../vendor/autoload.php';

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
use Slim\App;
use Slim\Factory\AppFactory;
use Kreait\Firebase\Factory;

$factory = (new Factory)
    // Ruta al JSON que descargaste de Firebase
    ->withServiceAccount(__DIR__ . '/../firebase/JSON_key/conectabuapws-firebase-adminsdk-fbsvc-1b605a7413.json') 
    // URL de tu Realtime Database
    ->withDatabaseUri('https://conectabuapws-default-rtdb.firebaseio.com/');

$database = $factory->createDatabase();

$suscripcionesWS = AppFactory::create();
$suscripcionesWS->setBasePath('/Servicios Web/Proyecto Final/backend/suscripcionesWS/WS_suscripciones.php');

$suscripcionesWS->get('/suscripciones/{usuario}', function (Request $request, Response $response, array $args) use ($database) {
    try {
        $usuario = $args['usuario'];
        
        // Verificar si el usuario existe
        $usuarioData = $database->getReference("Usuarios/{$usuario}")->getValue();
        if (!$usuarioData) {
            $errorData = [
                'status' => 'error',
                'message' => "Usuario {$usuario} no encontrado"
            ];
            $response->getBody()->write(json_encode($errorData));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }
        
        // Obtener suscripciones del usuario
        $suscripciones = $database->getReference("Suscripciones/{$usuario}")->getValue();
        
        $data = [
            'status' => 'success',
            'message' => 'Suscripciones obtenidas correctamente',
            'data' => [
                'usuario' => $usuario,
                'nombre' => $usuarioData['nombre'] ?? $usuario,
                'suscripciones' => $suscripciones ?: [
                    'libros' => false,
                    'periodicos' => false,
                    'revistas' => false,
                    'usuarios' => false
                ]
            ]
        ];
        
        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json');
        
    } catch (Exception $e) {
        $errorData = [
            'status' => 'error',
            'message' => 'Error al obtener suscripciones: ' . $e->getMessage()
        ];
        
        $response->getBody()->write(json_encode($errorData));
        return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
    }
});

$suscripcionesWS->post('/suscripciones/{usuario}/suscribir', function (Request $request, Response $response, array $args) use ($database) {
    try {
        $usuario = $args['usuario'];
        $body = $request->getParsedBody();
        
        // Validar datos
        if (empty($body['tipo'])) {
            $errorData = [
                'status' => 'error',
                'message' => 'Se requiere el tipo de suscripción (tipo)'
            ];
            $response->getBody()->write(json_encode($errorData));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        $tipo = $body['tipo'];
        
        // Verificar si el usuario existe
        $usuarioData = $database->getReference("Usuarios/{$usuario}")->getValue();
        if (!$usuarioData) {
            $errorData = [
                'status' => 'error',
                'message' => "Usuario {$usuario} no encontrado"
            ];
            $response->getBody()->write(json_encode($errorData));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }
        
        // Tipos de suscripción válidos según tu estructura
        $tiposValidos = ['libros', 'periodicos', 'revistas', 'usuarios'];
        if (!in_array($tipo, $tiposValidos)) {
            $errorData = [
                'status' => 'error',
                'message' => 'Tipo de suscripción inválido. Válidos: ' . implode(', ', $tiposValidos)
            ];
            $response->getBody()->write(json_encode($errorData));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        // Suscribir al tipo específico
        $database->getReference("Suscripciones/{$usuario}/{$tipo}")->set(true);
        
        // Obtener suscripciones actualizadas
        $suscripcionesActualizadas = $database->getReference("Suscripciones/{$usuario}")->getValue();
        
        $data = [
            'status' => 'success',
            'message' => "Usuario {$usuario} suscrito correctamente a {$tipo}",
            'data' => [
                'usuario' => $usuario,
                'tipo_suscripcion' => $tipo,
                'estado' => true,
                'suscripciones_actuales' => $suscripcionesActualizadas
            ]
        ];
        
        $response->getBody()->write(json_encode($data));
        return $response->withStatus(200)->withHeader('Content-Type', 'application/json');
        
    } catch (Exception $e) {
        $errorData = [
            'status' => 'error',
            'message' => 'Error al suscribir: ' . $e->getMessage()
        ];
        
        $response->getBody()->write(json_encode($errorData));
        return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
    }
});

$suscripcionesWS->post('/suscripciones/{usuario}/desuscribir', function (Request $request, Response $response, array $args) use ($database) {
    try {
        $usuario = $args['usuario'];
        $body = $request->getParsedBody();
        
        // Validar datos
        if (empty($body['tipo'])) {
            $errorData = [
                'status' => 'error',
                'message' => 'Se requiere el tipo de suscripción (tipo)'
            ];
            $response->getBody()->write(json_encode($errorData));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        $tipo = $body['tipo'];
        
        // Verificar si el usuario existe
        $usuarioData = $database->getReference("Usuarios/{$usuario}")->getValue();
        if (!$usuarioData) {
            $errorData = [
                'status' => 'error',
                'message' => "Usuario {$usuario} no encontrado"
            ];
            $response->getBody()->write(json_encode($errorData));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }
        
        // Tipos de suscripción válidos según tu estructura
        $tiposValidos = ['libros', 'periodicos', 'revistas', 'usuarios'];
        if (!in_array($tipo, $tiposValidos)) {
            $errorData = [
                'status' => 'error',
                'message' => 'Tipo de suscripción inválido. Válidos: ' . implode(', ', $tiposValidos)
            ];
            $response->getBody()->write(json_encode($errorData));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        // Desuscribir del tipo específico
        $database->getReference("Suscripciones/{$usuario}/{$tipo}")->set(false);
        
        // Obtener suscripciones actualizadas
        $suscripcionesActualizadas = $database->getReference("Suscripciones/{$usuario}")->getValue();
        
        $data = [
            'status' => 'success',
            'message' => "Usuario {$usuario} desuscrito correctamente de {$tipo}",
            'data' => [
                'usuario' => $usuario,
                'tipo_suscripcion' => $tipo,
                'estado' => false,
                'suscripciones_actuales' => $suscripcionesActualizadas
            ]
        ];
        
        $response->getBody()->write(json_encode($data));
        return $response->withStatus(200)->withHeader('Content-Type', 'application/json');
        
    } catch (Exception $e) {
        $errorData = [
            'status' => 'error',
            'message' => 'Error al desuscribir: ' . $e->getMessage()
        ];
        
        $response->getBody()->write(json_encode($errorData));
        return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
    }
});

$suscripcionesWS->run();