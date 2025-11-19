<?php

function create_document($project, $collection, $document) {
    $url = 'https://'.$project.'.firebaseio.com/'.$collection.'.json';

    $ch =  curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PATCH" );  // en sustitución de curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $document);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: text/plain'));
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

    $response = curl_exec($ch);

    curl_close($ch);

    // Se convierte a Object o NULL
    return json_decode($response);
}

$proyecto = 'conectabuapws-default-rtdb';
$coleccion = 'Suscripciones';

$data = '{
    "pruebas1": {
        "usuarios": true,
        "libros": true,
        "revistas": false,
        "periodicos": true
    },
    "pruebas2": {
        "usuarios": true,
        "libros": true,
        "revistas": false,
        "periodicos": true
    },
    "pruebas3": {
        "usuarios": true,
        "libros": true,
        "revistas": false,
        "periodicos": true
    },
    "pruebas4": {
        "usuarios": true,
        "libros": true,
        "revistas": false,
        "periodicos": true
    }
}';

$res = create_document($proyecto, $coleccion, $data);
if( !is_null($res) ) {
    echo '<br>Insersión exitosa<br>';
} else {
    echo '<br>Insersión fallida<br>';
}

?>