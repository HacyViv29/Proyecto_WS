<?php
namespace MyApp;

class MyFirebase {
    private $project;

    public function __construct($project) {
        $this->project = $project;
    }

    private function runCurl($collection, $document) {
        $url = 'https://'.$this->project.'.firebaseio.com/'.$collection.'/'.$document.'.json';

        $ch =  curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $response = curl_exec($ch);

        curl_close($ch);

        // Se convierte a Object o NULL
        return json_decode($response);
    }
}

?>