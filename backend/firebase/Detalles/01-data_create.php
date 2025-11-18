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
$coleccion = 'Detalles';

$data = '{
    "LIB001": {
        "Autor": "J.R.R. Tolkien",
        "Título": "El señor de los anillos",
        "Editorial": "Minotauro",
        "Fecha": "1954",
        "Portada": 
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
        "Fecha": "1982",
        "Precio": 380.00,
        "Descuento": 0.00
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
        "Fecha": "2007",
        "Precio": 550.00,
        "Descuento": 0.00
    }
}';

$res = create_document($proyecto, $coleccion, $data);
if( !is_null($res) ) {
    echo '<br>Insersión exitosa<br>';
} else {
    echo '<br>Insersión fallida<br>';
}

$data = '{
    "COM001": {
        "Autor": "Stan Lee y Steve Ditko",
        "Título": "The Amazing Spiderman",
        "Editorial": "Marvel Comics",
        "Fecha": "1963",
        "Precio": 150.00,
        "Descuento": 20.00
    }
}';

$res = create_document($proyecto, $coleccion, $data);
if( !is_null($res) ) {
    echo '<br>Insersión exitosa<br>';
} else {
    echo '<br>Insersión fallida<br>';
}

$data = '{
    "COM002": {
        "Autor": "Grant Morrison y Frank Quitely",
        "Título": "All-Star Superman",
        "Editorial": "DC Comics",
        "Fecha": "2005",
        "Precio": 200.00,
        "Descuento": 0.00
    }
}';

$res = create_document($proyecto, $coleccion, $data);
if( !is_null($res) ) {
    echo '<br>Insersión exitosa<br>';
} else {
    echo '<br>Insersión fallida<br>';
}

$data = '{
    "COM003": {
        "Autor": "Frank Miller",
        "Título": "Batman: The Dark Knight Returns",
        "Editorial": "DC Comics",
        "Fecha": "1986",
        "Precio": 250.00,
        "Descuento": 25.00
    }
}';

$res = create_document($proyecto, $coleccion, $data);
if( !is_null($res) ) {
    echo '<br>Insersión exitosa<br>';
} else {
    echo '<br>Insersión fallida<br>';
}

$data = '{
    "MAN001": {
        "Autor": "Akira Toriyama",
        "Título": "Dragon Ball",
        "Editorial": "Shueisha",
        "Fecha": "1984",
        "Precio": 180.00,
        "Descuento": 50.00
    }
}';

$res = create_document($proyecto, $coleccion, $data);
if( !is_null($res) ) {
    echo '<br>Insersión exitosa<br>';
} else {
    echo '<br>Insersión fallida<br>';
}

$data = '{
    "MAN002": {
        "Autor": "Yoshiyuki Sadamoto",
        "Título": "Neon Genesis Evangelion",
        "Editorial": "Kadokawa Shoten",
        "Fecha": "1994",
        "Precio": 220.00,
        "Descuento": 0.00
    }
}';

$res = create_document($proyecto, $coleccion, $data);
if( !is_null($res) ) {
    echo '<br>Insersión exitosa<br>';
} else {
    echo '<br>Insersión fallida<br>';
}

$data = '{
    "MAN003": {
        "Autor": "Go Nagai",
        "Título": "Mazinger Z",
        "Editorial": "Shueisha",
        "Fecha": "1972",
        "Precio": 200.00,
        "Descuento": 0.00
    }
}';

$res = create_document($proyecto, $coleccion, $data);
if( !is_null($res) ) {
    echo '<br>Insersión exitosa<br>';
} else {
    echo '<br>Insersión fallida<br>';
}

