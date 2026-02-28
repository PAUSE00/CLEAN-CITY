<?php
// api/config/db.php
// Configuration PDO pour la connexion à la base de données MySQL "villepropre_db"

$host = '127.0.0.1';
$db   = 'villepropre_db';
$user = 'root';
$pass = ''; // Vide par défaut avec XAMPP
$charset = 'utf8mb4';

// Support pour les variables d'environnement de Railway
if (getenv('MYSQLHOST')) {
    $host = getenv('MYSQLHOST');
    if (getenv('MYSQLPORT')) {
        $host .= ';port=' . getenv('MYSQLPORT');
    }
}
if (getenv('MYSQLDATABASE')) $db = getenv('MYSQLDATABASE');
if (getenv('MYSQLUSER'))     $user = getenv('MYSQLUSER');
if (getenv('MYSQLPASSWORD')) $pass = getenv('MYSQLPASSWORD');

// Support alternatif pour l'URL de connexion (MYSQL_URL)
if (getenv('MYSQL_URL')) {
    $dbopts = parse_url(getenv('MYSQL_URL'));
    $host = $dbopts["host"] . ';port=' . $dbopts["port"];
    $user = $dbopts["user"];
    $pass = $dbopts["pass"];
    $db   = ltrim($dbopts["path"], '/');
}

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Remonte les erreurs SQL sous forme d'exceptions
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Retourne les données sous forme de tableau associatif
    PDO::ATTR_EMULATE_PREPARES   => false,                  // Utilise les requêtes préparées réelles pour sécurité contre SQL Injection
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    // En cas d'erreur de connexion, on renvoie une erreur 500 au format JSON
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode([
        'error' => 'Erreur de connexion à la base de données.',
        'message' => $e->getMessage()
    ]);
    exit;
}
