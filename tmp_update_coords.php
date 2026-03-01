<?php
// Script to run on Railway to update lat/lng coordinates for Agadir points
// Center: 30.4277, -9.5981

$host = getenv('MYSQLHOST');
$user = getenv('MYSQLUSER');
$pass = getenv('MYSQLPASSWORD');
// Extract db name from MYSQL_URL if MYSQL_DATABASE is not set by Railway
$url = getenv('MYSQL_URL');
$db = 'railway'; // default for railway
if ($url && preg_match('/\/([^\/]+)$/', $url, $matches)) {
    $db = parse_url($url, PHP_URL_PATH);
    $db = str_replace('/', '', $db);
}

try {
    $dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";
    $pdo = new PDO($dsn, $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Some approximate coordinates around Agadir for the 10 points
    // 0: Dépôt (Center) -> 30.4277, -9.5981
    // 1: Quartier Nord -> 30.4400, -9.6000
    // 2: Centre Ville -> 30.4200, -9.5900
    // 3: Zone Industrielle -> 30.4100, -9.5500
    // 4: Quartier Est -> 30.4300, -9.5600
    // 5: Quartier Ouest -> 30.4250, -9.6200
    // 6: Zone Commerciale -> 30.4150, -9.5700
    // 7: Quartier Sud -> 30.4000, -9.6000
    // 8: Zone Résidentielle -> 30.4350, -9.5800
    // 9: Nouveau Quartier -> 30.4500, -9.5850

    $updates = [
        "UPDATE points SET lat = 30.4277, lng = -9.5981 WHERE id = 0",
        "UPDATE points SET lat = 30.4400, lng = -9.6000 WHERE id = 1",
        "UPDATE points SET lat = 30.4200, lng = -9.5900 WHERE id = 2",
        "UPDATE points SET lat = 30.4100, lng = -9.5500 WHERE id = 3",
        "UPDATE points SET lat = 30.4300, lng = -9.5600 WHERE id = 4",
        "UPDATE points SET lat = 30.4250, lng = -9.6200 WHERE id = 5",
        "UPDATE points SET lat = 30.4150, lng = -9.5700 WHERE id = 6",
        "UPDATE points SET lat = 30.4000, lng = -9.6000 WHERE id = 7",
        "UPDATE points SET lat = 30.4350, lng = -9.5800 WHERE id = 8",
        "UPDATE points SET lat = 30.4500, lng = -9.5850 WHERE id = 9"
    ];

    foreach ($updates as $sql) {
        $pdo->exec($sql);
    }

    echo "Successfully updated lat/lng coordinates in the database!";
} catch (PDOException $e) {
    echo "Connection failed: " . $e->getMessage();
}
