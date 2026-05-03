import sys
import json

data = json.load(sys.stdin)
sql = data.get("tool_input", {}).get("query", "").upper()

if "DELETE" in sql:
    print("Operación DELETE bloqueada: no se permite borrar usuarios ni transacciones", file=sys.stderr)
    sys.exit(2)