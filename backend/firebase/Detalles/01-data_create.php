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

$proyecto = 'contenidoconectbuap-default-rtdb';
$coleccion = 'Detalles';

$data = '{
    "LIB001": {
        "Autor": "J.R.R. Tolkien",
        "Título": "El señor de los anillos",
        "Editorial": "Minotauro",
        "Fecha": "1954"
    }
}';

$res = create_document($proyecto, $coleccion, $data);
if( !is_null($res) ) {
    echo '<br>Insersión exitosa<br>';
} else {
    echo '<br>Insersión fallida<br>';
}

$data = '{
    "LIB002": {
        "Autor": "Isaac Asimov",
        "Título": "Los límites de la Fundación",
        "Editorial": "Plaza y Janés",
        "Fecha": "1982"
    }
}';

$res = create_document($proyecto, $coleccion, $data);
if( !is_null($res) ) {
    echo '<br>Insersión exitosa<br>';
} else {
    echo '<br>Insersión fallida<br>';
}

$data = '{
    "LIB003": {
        "Autor": "Obie Fernandez",
        "Título": "The Rails Way",
        "Editorial": "Addison-Wesley",
        "Fecha": "2007"
    }
}';

$res = create_document($proyecto, $coleccion, $data);
if( !is_null($res) ) {
    echo '<br>Insersión exitosa<br>';
} else {
    echo '<br>Insersión fallida<br>';
}

$data = '{
    "REV001": {
        "Autor": "Carl Sagan",
        "Título": "Science",
        "Editorial": "Science Magazine",
        "Fecha": "2021"
    }
}';

$res = create_document($proyecto, $coleccion, $data);
if( !is_null($res) ) {
    echo '<br>Insersión exitosa<br>';
} else {
    echo '<br>Insersión fallida<br>';
}

$data = '{
    "REV002": {
        "Autor": "Stephen Hawking",
        "Título": "Muy interesante",
        "Editorial": "Muy interesante S.A.",
        "Fecha": "2005"
    }
}';

$res = create_document($proyecto, $coleccion, $data);
if( !is_null($res) ) {
    echo '<br>Insersión exitosa<br>';
} else {
    echo '<br>Insersión fallida<br>';
}

$data = '{
    "REV003": {
        "Autor": "Various Authors",
        "Título": "National Geographic",
        "Editorial": "National Geographic Society",
        "Fecha": "2023"
    }
}';

$res = create_document($proyecto, $coleccion, $data);
if( !is_null($res) ) {
    echo '<br>Insersión exitosa<br>';
} else {
    echo '<br>Insersión fallida<br>';
}

$data = '{
    "PER001": {
        "Autor": "Various Authors",
        "Título": "El Sol de México",
        "Editorial": "Periodicos Hoy S.A. de C.V.",
        "Fecha": "2025"
    }
}';

$res = create_document($proyecto, $coleccion, $data);
if( !is_null($res) ) {
    echo '<br>Insersión exitosa<br>';
} else {
    echo '<br>Insersión fallida<br>';
}

$data = '{
    "PER002": {
        "Autor": "Various Authors",
        "Título": "El Universal",
        "Editorial": "El Universal S.A. de C.V.",
        "Fecha": "2000"
    }
}';

$res = create_document($proyecto, $coleccion, $data);
if( !is_null($res) ) {
    echo '<br>Insersión exitosa<br>';
} else {
    echo '<br>Insersión fallida<br>';
}

$data = '{
    "PER003": {
        "Autor": "Various Authors",
        "Título": "La jornada",
        "Editorial": "Periodicos La Jornada S.A. de C.V.",
    }
}';

$res = create_document($proyecto, $coleccion, $data);
if( !is_null($res) ) {
    echo '<br>Insersión exitosa<br>';
} else {
    echo '<br>Insersión fallida<br>';
}

