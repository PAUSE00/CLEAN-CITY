<?php
// api/vrp.php
require_once 'config/db.php';

header('Content-Type: application/json');

try {
    // Helper function to calculate sub-route distance
    function route_distance($route, $matrix)
    {
        $dist = 0;
        for ($i = 0; $i < count($route) - 1; $i++) {
            $u = $route[$i];
            $v = $route[$i + 1];
            $dist += isset($matrix[$u][$v]) ? $matrix[$u][$v] : INF;
        }
        return $dist;
    }

    // 2-opt optimization for a single depot-to-depot trip
    function optimize_2opt($route, $matrix)
    {
        if (count($route) <= 3) return $route;

        $best_route = $route;
        $improved = true;

        while ($improved) {
            $improved = false;
            $best_distance = route_distance($best_route, $matrix);

            for ($i = 1; $i < count($best_route) - 2; $i++) {
                for ($k = $i + 1; $k < count($best_route) - 1; $k++) {
                    $new_route = $best_route;
                    $reversed = array_reverse(array_slice($best_route, $i, $k - $i + 1));
                    array_splice($new_route, $i, $k - $i + 1, $reversed);

                    $new_distance = route_distance($new_route, $matrix);

                    if ($new_distance < $best_distance - 0.0001) { // -0.0001 for floating point issues
                        $best_route = $new_route;
                        $best_distance = $new_distance;
                        $improved = true;
                    }
                }
            }
        }

        return $best_route;
    }

    // 1. Fetch distances matrix
    $stmt = $pdo->query("SELECT source_id, target_id, distance FROM matrix");
    $matrixData = $stmt->fetchAll();
    $matrix = [];
    foreach ($matrixData as $m) {
        $matrix[(int)$m['source_id']][(int)$m['target_id']] = (float)$m['distance'];
    }

    // 2. Fetch Camions and their capacities
    $trucksStmt = $pdo->query("SELECT id, cap FROM camions");
    $trucks = $trucksStmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Fetch Zones and their volumes
    $zonesStmt = $pdo->query("SELECT id, vol FROM zones WHERE id != 0"); // 0 is depot
    $zonesData = $zonesStmt->fetchAll(PDO::FETCH_ASSOC);
    $zoneVolumes = [];
    foreach ($zonesData as $z) {
        $zoneVolumes[(int)$z['id']] = (int)$z['vol'];
    }

    // 4. Fetch assignments
    $assignStmt = $pdo->query("SELECT camion_id, zone_id FROM camion_zones");
    $assignments = $assignStmt->fetchAll(PDO::FETCH_ASSOC);

    $truckZones = [];
    foreach ($trucks as $t) {
        $truckZones[(int)$t['id']] = [];
    }
    foreach ($assignments as $a) {
        if (isset($truckZones[(int)$a['camion_id']])) {
            $truckZones[(int)$a['camion_id']][] = (int)$a['zone_id'];
        }
    }

    // 5. Build CVRP Routes per truck
    $routes = [];
    $allVrpRoutes = [];

    foreach ($trucks as $truck) {
        $tId = (int)$truck['id'];
        $cap = (int)$truck['cap'];
        $assigned = $truckZones[$tId];

        if (empty($assigned)) {
            // Truck has no assigned zones, just stays at depot or doesn't move
            $allVrpRoutes[] = [0, 0];
            continue;
        }

        $unvisited = $assigned;
        $route = [0]; // Start at depot
        $currentLoad = 0;
        $currNode = 0;

        while (!empty($unvisited)) {
            // Find nearest unvisited assigned zone
            $nearest = -1;
            $minDist = INF;
            foreach ($unvisited as $node) {
                $dist = isset($matrix[$currNode][$node]) ? $matrix[$currNode][$node] : INF;
                if ($dist < $minDist) {
                    $minDist = $dist;
                    $nearest = $node;
                }
            }

            if ($nearest !== -1) {
                $vol = isset($zoneVolumes[$nearest]) ? $zoneVolumes[$nearest] : 0;

                // Check capacity constraint
                if ($currentLoad + $vol > $cap) {
                    // Force return to depot to empty
                    $route[] = 0;
                    $currentLoad = 0;
                    $currNode = 0;
                    // Do not mark nearest as visited yet, we will visit it on next loop iteration from the depot
                } else {
                    // Visit the node
                    $route[] = $nearest;
                    $currentLoad += $vol;
                    $currNode = $nearest;

                    // Remove from unvisited
                    $unvisited = array_values(array_diff($unvisited, [$nearest]));
                }
            } else {
                break; // Failsafe
            }
        }
        $route[] = 0; // Final return to depot

        // Apply 2-opt POST OPTIMIZATION to each depot-depot segment
        $optimizedRoute = [0];
        $currentTrip = [0];

        for ($i = 1; $i < count($route); $i++) {
            $currentTrip[] = $route[$i];
            if ($route[$i] === 0) {
                // We completed a depot-to-depot trip
                $currentTrip = optimize_2opt($currentTrip, $matrix);

                // Append optimized nodes to the final route
                for ($j = 1; $j < count($currentTrip); $j++) {
                    $optimizedRoute[] = $currentTrip[$j];
                }
                // Start next trip
                $currentTrip = [0];
            }
        }

        $allVrpRoutes[] = $optimizedRoute;
    }

    echo json_encode([
        'success' => true,
        'vrp_routes' => $allVrpRoutes
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
