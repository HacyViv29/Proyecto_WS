<?php
require __DIR__ . '/../vendor/autoload.php';

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
use Slim\App;
use Slim\Factory\AppFactory;
use Kreait\Firebase\Factory;

$factory = (new Factory)
    // Ruta al JSON que descargaste de Firebase
    ->withServiceAccount(__DIR__ . '/../firebase/JSON_key/Suscripciones/suscripconectbuap-firebase-adminsdk-fbsvc-6977949909.json') 
    // URL de tu Realtime Database
    ->withDatabaseUri('https://suscripconectbuap-default-rtdb.firebaseio.com/');

$database = $factory->createDatabase();

$suscripcionesWS = AppFactory::create();
$suscripcionesWS->setBasePath('/Servicios Web/Proyecto Final/backend/suscripcionesWS/WS_suscripciones.php');

$suscripcionesWS->get('/suscripciones', function (Request $request, Response $response, array $args) use ($database) {
    try {
        
        // Obtener suscripciones del usuario
        $suscripciones = $database->getReference("Suscripciones")->getValue();
        
        $data = [
            'status' => 'success',
            'message' => 'Suscripciones obtenidas correctamente',
            'data' => [
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

$suscripcionesWS->get('/suscripciones/{usuario}', function (Request $request, Response $response, array $args) use ($database) {
    try {
        $usuario = $args['usuario'];
        
        // Verificar si el usuario existe
        $usuarioData = $database->getReference("Suscripciones/{$usuario}")->getValue();
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

$suscripcionesWS->post('/suscripciones/crear', function (Request $request, Response $response) use ($database) {
    try {
        $body = $request->getParsedBody();

        if (empty($body['correo'])) {
            $errorData = [
                'status' => 'error',
                'message' => 'Se requiere el correo del usuario (correo)'
            ];
            $response->getBody()->write(json_encode($errorData));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $correo = $body['correo'];

        // Crear entrada inicial de suscripciones
        $database->getReference("Suscripciones/{$correo}")->set([
            'libros' => false,
            'periodicos' => false,
            'revistas' => false,
            'usuarios' => false
        ]);

        $data = [
            'status' => 'success',
            'message' => "Suscripciones creadas para el usuario {$correo}",
            'data' => [
                'correo' => $correo,
                'suscripciones' => [
                    'libros' => false,
                    'periodicos' => false,
                    'revistas' => false,
                    'usuarios' => false
                ]
            ]
        ];

        $response->getBody()->write(json_encode($data));
        return $response->withStatus(201)->withHeader('Content-Type', 'application/json');

    } catch (Exception $e) {
        $errorData = [
            'status' => 'error',
            'message' => 'Error al crear suscripciones: ' . $e->getMessage()
        ];
        $response->getBody()->write(json_encode($errorData));
        return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
    }
});


$suscripcionesWS->put('/suscripciones/actualizar', function (Request $request, Response $response) use ($database) {
    try {
        $body = $request->getParsedBody();

        if (empty($body['correo'])) {
            $errorData = [
                'status' => 'error',
                'message' => 'Se requiere el correo del usuario (correo)'
            ];
            $response->getBody()->write(json_encode($errorData));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $correo = $body['correo'];

        // Construir arreglo con valores recibidos
        $suscripciones = [
            'libros' => $body['libros'] ?? false,
            'periodicos' => $body['periodicos'] ?? false,
            'revistas' => $body['revistas'] ?? false,
            'usuarios' => $body['usuarios'] ?? false
        ];

        // Verificar que el usuario exista
        $ref = $database->getReference("Suscripciones/{$correo}");
        $existing = $ref->getValue();

        if ($existing === null) {
            $errorData = [
                'status' => 'error',
                'message' => "No existe una suscripción para el usuario {$correo}"
            ];
            $response->getBody()->write(json_encode($errorData));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }

        // Actualizar valores
        $ref->update($suscripciones);

        $data = [
            'status' => 'success',
            'message' => "Suscripciones actualizadas correctamente",
            'correo' => $correo,
            'suscripciones' => $suscripciones
        ];

        $response->getBody()->write(json_encode($data));
        return $response->withStatus(200)->withHeader('Content-Type', 'application/json');

    } catch (Exception $e) {
        $errorData = [
            'status' => 'error',
            'message' => 'Error al actualizar suscripciones: ' . $e->getMessage()
        ];
        $response->getBody()->write(json_encode($errorData));
        return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
    }
});

$suscripcionesWS->post('/notificaciones/guardar', function (Request $request, Response $response) use ($database) {
    $body = $request->getParsedBody();
    
    $destinatarios = $body['destinatarios'] ?? [];
    $datos = $body['datos'] ?? [];

    if (empty($destinatarios) || empty($datos)) {
        $response->getBody()->write(json_encode(['status' => 'error', 'message' => 'Datos incompletos']));
        return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
    }

    try {
        // Escribir en Firebase (Nodo: Notificaciones -> Usuario)
        foreach ($destinatarios as $usuarioKey) {
            // Aseguramos clave válida para Firebase
            $key = str_replace('.', ',', $usuarioKey);
            $database->getReference("Notificaciones/{$key}")->push($datos);
        }

        $response->getBody()->write(json_encode(['status' => 'success', 'message' => 'Guardado en Firebase']));
        return $response->withHeader('Content-Type', 'application/json');

    } catch (Exception $e) {
        $response->getBody()->write(json_encode(['status' => 'error', 'message' => $e->getMessage()]));
        return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
    }
});

// 2. LEER NOTIFICACIONES (Tu Frontend JS llama a este endpoint)
$suscripcionesWS->get('/notificaciones/{usuario}', function (Request $request, Response $response, array $args) use ($database) {
    $usuario = $args['usuario'];
    $key = str_replace('.', ',', $usuario);

    try {
        $ref = $database->getReference("Notificaciones/{$key}");
        // Traemos las últimas 10 para no saturar
        // Agregamos orderByKey() antes del limite
        $snapshot = $ref->orderByKey()->limitToLast(10)->getValue();

        $lista = [];
        if ($snapshot) {
            foreach ($snapshot as $id => $val) {
                $val['id'] = $id;
                $lista[] = $val;
            }
            // Ordenar: nuevas primero
            $lista = array_reverse($lista);
        }

        $response->getBody()->write(json_encode(['status' => 'success', 'data' => $lista]));
        return $response->withHeader('Content-Type', 'application/json');

    } catch (Exception $e) {
        $response->getBody()->write(json_encode(['status' => 'error', 'message' => $e->getMessage()]));
        return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
    }
});


$suscripcionesWS->run();