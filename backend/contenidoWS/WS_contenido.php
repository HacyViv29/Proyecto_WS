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

$contenidoWS = AppFactory::create();
$contenidoWS->setBasePath('/Servicios Web/Proyecto Final/backend/contenidoWS/WS_contenido.php');

$contenidoWS->get('/contenido',function (Request $request, Response $response, $args) use($database) {
    try {
        $productos = $database->getReference('Productos')->getValue();
        
        $data = [
            'status' => 'success',
            'message' => 'Productos obtenidos correctamente',
            'data' => $productos ?: []
        ];
        
        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json');
        
    } catch (Exception $e) {
        $errorData = [
            'status' => 'error',
            'message' => 'Error al obtener productos: ' . $e->getMessage()
        ];
        
        $response->getBody()->write(json_encode($errorData));
        return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
    }
});

$contenidoWS->get('/contenido/{nombre}', function (Request $request, Response $response, $args) use ($database) {
    try {
        $termino = strtolower($args['nombre']);
        $productos = $database->getReference('Productos')->getValue();

        $resultados = [];
        
        if ($productos) {
            foreach ($productos as $categoria => $items) {
                foreach ($items as $id => $nombre) {
                    // Buscar coincidencias en el nombre del producto
                    if (stripos(strtolower($nombre), $termino) !== false) {
                        $resultados[] = [
                            'id' => $id,
                            'categoria' => $categoria,
                            'nombre' => $nombre,
                            'tipo' => $categoria // comics, libros, mangas
                        ];
                    }
                }
            }
        }
        
        $data = [
            'status' => 'success',
            'message' => count($resultados) . " resultados encontrados para '{$termino}'",
            'termino_busqueda' => $termino,
            'total_resultados' => count($resultados),
            'data' => $resultados
        ];
        
        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json');
        
    } catch (Exception $e) {
        $errorData = [
            'status' => 'error',
            'message' => 'Error en la búsqueda: ' . $e->getMessage()
        ];
        
        $response->getBody()->write(json_encode($errorData));
        return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
    }
});

$contenidoWS->get('/contenido/categoria/{categoria}', function (Request $request, Response $response, $args) use($database) {
    try {
        $categoria = $args['categoria'];
        $productos = $database->getReference("Productos/{$categoria}")->getValue();
        
        $data = [
            'status' => 'success',
            'message' => "Productos en la categoría {$categoria} obtenidos correctamente",
            'data' => $productos ?: []
        ];
        
        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json');
        
    } catch (Exception $e) {
        $errorData = [
            'status' => 'error',
            'message' => 'Error al obtener productos por categoría: ' . $e->getMessage()
        ];
        
        $response->getBody()->write(json_encode($errorData));
        return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
    }
});

$contenidoWS->post('/contenido', function (Request $request, Response $response, $args) use ($database) {
     try {
        $body = $request->getParsedBody();
        
        // Validar datos requeridos
        if (empty($body['isbn']) || empty($body['categoria']) || empty($body['nombre']) || empty($body['detalles'])) {
            $errorData = [
                'status' => 'error',
                'message' => 'Datos incompletos. Se requieren: isbn, categoria, nombre y detalles'
            ];
            $response->getBody()->write(json_encode($errorData));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        $isbn = $body['isbn'];
        $categoria = $body['categoria'];
        $nombre = $body['nombre'];
        $detalles = $body['detalles'];
        
        // Validar que la categoría sea válida
        $categoriasValidas = ['comics', 'libros', 'mangas'];
        if (!in_array($categoria, $categoriasValidas)) {
            $errorData = [
                'status' => 'error',
                'message' => 'Categoría inválida. Las categorías válidas son: ' . implode(', ', $categoriasValidas)
            ];
            $response->getBody()->write(json_encode($errorData));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
        
        // Verificar si el ISBN ya existe
        $productoExistente = $database->getReference("Productos/{$categoria}/{$isbn}")->getValue();
        $detalleExistente = $database->getReference("Detalles/{$isbn}")->getValue();
        
        if ($productoExistente || $detalleExistente) {
            $errorData = [
                'status' => 'error',
                'message' => "El ISBN {$isbn} ya existe en el sistema"
            ];
            $response->getBody()->write(json_encode($errorData));
            return $response->withStatus(409)->withHeader('Content-Type', 'application/json');
        }
        
        // Agregar a Productos
        $database->getReference("Productos/{$categoria}/{$isbn}")->set($nombre);
        
        // Agregar a Detalles
        $database->getReference("Detalles/{$isbn}")->set($detalles);
        
        $data = [
            'status' => 'success',
            'message' => 'Contenido agregado correctamente',
            'data' => [
                'isbn' => $isbn,
                'categoria' => $categoria,
                'nombre' => $nombre,
                'detalles' => $detalles
            ]
        ];
        
        $response->getBody()->write(json_encode($data));
        return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
        
    } catch (Exception $e) {
        $errorData = [
            'status' => 'error',
            'message' => 'Error al agregar contenido: ' . $e->getMessage()
        ];
        
        $response->getBody()->write(json_encode($errorData));
        return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
    }
});

$contenidoWS->put('/contenido/{isbn}', function (Request $request, Response $response, $args) use ($database) {
     try {
        $isbn = $args['isbn'];
        $body = $request->getParsedBody();
        
        // Buscar el producto en todas las categorías para obtener su categoría actual
        $productos = $database->getReference('Productos')->getValue();
        $categoriaActual = null;
        
        if ($productos) {
            foreach ($productos as $categoria => $items) {
                if (isset($items[$isbn])) {
                    $categoriaActual = $categoria;
                    break;
                }
            }
        }
        
        if (!$categoriaActual) {
            $errorData = [
                'status' => 'error',
                'message' => "Producto con ISBN {$isbn} no encontrado"
            ];
            $response->getBody()->write(json_encode($errorData));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }
        
        // Actualizar en Productos si se proporciona nombre o categoría
        if (isset($body['nombre']) || isset($body['categoria'])) {
            $nuevaCategoria = isset($body['categoria']) ? $body['categoria'] : $categoriaActual;
            $nuevoNombre = isset($body['nombre']) ? $body['nombre'] : $productos[$categoriaActual][$isbn];
            
            // Si cambió la categoría, eliminar de la categoría anterior y agregar a la nueva
            if ($nuevaCategoria !== $categoriaActual) {
                $database->getReference("Productos/{$categoriaActual}/{$isbn}")->remove();
                $database->getReference("Productos/{$nuevaCategoria}/{$isbn}")->set($nuevoNombre);
            } else {
                // Si es la misma categoría, solo actualizar el nombre
                $database->getReference("Productos/{$categoriaActual}/{$isbn}")->set($nuevoNombre);
            }
        }
        
        // Actualizar en Detalles si se proporcionan detalles
        if (isset($body['detalles'])) {
            $detallesActuales = $database->getReference("Detalles/{$isbn}")->getValue();
            $nuevosDetalles = array_merge($detallesActuales ?: [], $body['detalles']);
            $database->getReference("Detalles/{$isbn}")->update($nuevosDetalles);
        }
        
        $data = [
            'status' => 'success',
            'message' => "Contenido con ISBN {$isbn} actualizado correctamente",
            'data' => [
                'isbn' => $isbn,
                'categoria_actual' => $nuevaCategoria ?? $categoriaActual,
                'actualizaciones' => $body
            ]
        ];
        
        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json');
        
    } catch (Exception $e) {
        $errorData = [
            'status' => 'error',
            'message' => 'Error al actualizar contenido: ' . $e->getMessage()
        ];
        
        $response->getBody()->write(json_encode($errorData));
        return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
    }
});

$contenidoWS->delete('/contenido/{isbn}', function (Request $request, Response $response, $args) use ($database) {
    try {
        $isbn = $args['isbn'];
        
        // Buscar el producto en todas las categorías
        $productos = $database->getReference('Productos')->getValue();
        $categoriaEncontrada = null;
        
        if ($productos) {
            foreach ($productos as $categoria => $items) {
                if (isset($items[$isbn])) {
                    $categoriaEncontrada = $categoria;
                    break;
                }
            }
        }
        
        if (!$categoriaEncontrada) {
            $errorData = [
                'status' => 'error',
                'message' => "Producto con ISBN {$isbn} no encontrado"
            ];
            $response->getBody()->write(json_encode($errorData));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }
        
        // Eliminar de Productos
        $database->getReference("Productos/{$categoriaEncontrada}/{$isbn}")->remove();
        
        // Eliminar de Detalles
        $database->getReference("Detalles/{$isbn}")->remove();
        
        $data = [
            'status' => 'success',
            'message' => "Contenido con ISBN {$isbn} eliminado correctamente de ambas colecciones",
            'data' => [
                'isbn_eliminado' => $isbn,
                'categoria' => $categoriaEncontrada
            ]
        ];
        
        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json');
        
    } catch (Exception $e) {
        $errorData = [
            'status' => 'error',
            'message' => 'Error al eliminar contenido: ' . $e->getMessage()
        ];
        
        $response->getBody()->write(json_encode($errorData));
        return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
    }
});

$contenidoWS->run();