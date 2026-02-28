import json
import re
import subprocess
import os

with open('js/data.js', 'r', encoding='utf-8') as f:
    text = f.read()

matrix_match = re.search(r'const MATRIX = (\[\[.*?\]\]);', text)
if matrix_match:
    matrix = json.loads(matrix_match.group(1))
    sql_inserts = []
    for i, row in enumerate(matrix):
        for j, dist in enumerate(row):
            sql_inserts.append(f"({i}, {j}, {dist})")
    
    with open('matrix_inserts.sql', 'w', encoding='utf-8') as f:
        f.write("USE villepropre_db;\n")
        f.write("INSERT IGNORE INTO matrix (source_id, target_id, distance) VALUES\n")
        f.write(",\n".join(sql_inserts) + ";\n")
    
    print("Created matrix_inserts.sql")
else:
    print("Could not find MATRIX in data.js")
