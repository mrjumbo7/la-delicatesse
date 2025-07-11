<?php
class Translator {
    private $rapidapi_key;
    private $rapidapi_host = 'google-translate1.p.rapidapi.com';

    public function __construct($rapidapi_key) {
        $this->rapidapi_key = $rapidapi_key;
    }

    public function translate($text, $target_lang = 'en', $source_lang = 'es') {
        $curl = curl_init();

        $encoded_text = urlencode($text);

        curl_setopt_array($curl, [
            CURLOPT_URL => "https://google-translate1.p.rapidapi.com/language/translate/v2",
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_ENCODING => "",
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => "POST",
            CURLOPT_POSTFIELDS => "q=$encoded_text&target=$target_lang&source=$source_lang",
            CURLOPT_HTTPHEADER => [
                "content-type: application/x-www-form-urlencoded",
                "X-RapidAPI-Host: " . $this->rapidapi_host,
                "X-RapidAPI-Key: " . $this->rapidapi_key
            ],
        ]);

        $response = curl_exec($curl);
        $err = curl_error($curl);

        curl_close($curl);

        if ($err) {
            throw new Exception("Error en la traducción: " . $err);
        }

        $result = json_decode($response, true);

        if (isset($result['data']['translations'][0]['translatedText'])) {
            return $result['data']['translations'][0]['translatedText'];
        } else {
            throw new Exception("Error al obtener la traducción");
        }
    }

    public function translateArray($texts, $target_lang = 'en', $source_lang = 'es') {
        $translations = [];
        foreach ($texts as $key => $text) {
            try {
                $translations[$key] = $this->translate($text, $target_lang, $source_lang);
                // Pequeña pausa para evitar límites de rate
                usleep(100000); // 100ms
            } catch (Exception $e) {
                $translations[$key] = $text; // Mantener texto original en caso de error
                error_log($e->getMessage());
            }
        }
        return $translations;
    }
}