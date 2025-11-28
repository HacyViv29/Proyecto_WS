<?php

function create_document($project, $collection, $document) {
    $url = 'https://'.$project.'.firebaseio.com/'.$collection.'.json';

    $ch =  curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PATCH" ); 
    curl_setopt($ch, CURLOPT_POSTFIELDS, $document);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: text/plain'));
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

    $response = curl_exec($ch);
    curl_close($ch);

    return json_decode($response);
}

// Configuración
$proyecto = 'authconectbuap-default-rtdb';
$coleccion = 'Usuarios';

// NOTA IMPORTANTE:
// Firebase NO permite puntos (.) en las claves.
// Para usar el email como ID, reemplazamos el punto del dominio por una coma (,)
// Ejemplo: "marydoe@mail.com" se convierte en la clave "marydoe@mail,com"

$data = '{
    "marydoe@mail,com": {
        "email": "marydoe@mail.com",
        "first_name": "Mary",
        "last_name": "Doe",
        "role": "admin",
        "telephone": "1234567890",
        "password_hash": "$2b$12$OCviQ13UcXFYvGUumIlqq.sZa3CasrcH48k6dg2lLPUNbgbP3xg9K",
        "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiJtYXJ5ZG9lQG1haWwuY29tIiwiZXhwIjoxNzY0MzY1NzEwLCJtb2RlIjoicmVmcmVzaF90b2tlbiJ9.2Eo-8fZ9DRceuIMri3J9RYcMs9G8kL0a-bV211Cvq1U"
    },
    "marydoe2@mail,com": {
        "email": "marydoe2@mail.com",
        "first_name": "Mary",
        "last_name": "Doe",
        "role": "client",
        "telephone": null,
        "password_hash": "$2b$12$izqxNzcLUiLtKP6zx8EA5ej4PYqUQ1t10dPv/YMbTcxrr7U7Q2jwG",
        "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiJtYXJ5ZG9lMkBtYWlsLmNvbSIsImV4cCI6MTc2NDk1ODM2NywibW9kZSI6InJlZnJlc2hfdG9rZW4ifQ.vY_rLUsWhTCa6t7Nf5ddLKyLl7LCwa4Z6_eb3spvgXw"
    },
    "hacyviv29@gmail,com": {
        "email": "hacyviv29@gmail.com",
        "first_name": "Haciel",
        "last_name": "Viveros",
        "role": "client",
        "telephone": "0123456789",
        "password_hash": "$2b$12$/P/PemnupxcZqOeIPkxdvO/0VaBZBuWmiKadAxsIp6TtnN.2ZE1BS",
        "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiJoYWN5dml2MjlAZ21haWwuY29tIiwiZXhwIjoxNzY0OTEzNTI5LCJtb2RlIjoicmVmcmVzaF90b2tlbiJ9.Pe2K1jyTKZChNfdlXdCbemxHO6eAurF5Z4lJKA4Lgls"
    }
}';

$res = create_document($proyecto, $coleccion, $data);

if( !is_null($res) ) {
    echo '<br>Inserción exitosa (Base de datos inicializada)<br>';
    echo '<pre>';
    print_r($res);
    echo '</pre>';
} else {
    echo '<br>Inserción fallida<br>';
}

?>