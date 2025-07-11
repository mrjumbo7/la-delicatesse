<?php
// Archivo de configuración para claves de API
class APIKeys {
    // RapidAPI Key para Google Translate
    private static $rapidapi_key = '7b21e88401msha084538c42c2a2ep1855d4jsnbe3e9beca66b';

    public static function getRapidAPIKey() {
        return self::$rapidapi_key;
    }
}