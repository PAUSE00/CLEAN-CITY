<?php
// api/update_truck.php
require_once 'config/db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$id = isset($data['id']) ? (int)$data['id'] : null;
$cap = isset($data['cap']) ? (int)$data['cap'] : null;

if (!$id || !$cap) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing id or capacity parameters']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE camions SET cap = ? WHERE id = ?");
    $result = $stmt->execute([$cap, $id]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Truck updated successfully']);
    } else {
        echo json_encode(['success' => false, 'error' => 'Truck not found or no change made']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
