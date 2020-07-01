import sys
import json

from pyswagger import App

vertices = []
app = App._create_(sys.argv[1])
for id, op in app.op.items():
    vertices.append({
        'id': id,
        'type': "route",
        'props': [
            {"name": "path", "value": op.path},
            {"name": "verb", "value": op.method.upper()},
        ]
    })

print(json.dumps({
    "id": "swagger_map",
    "vertices": vertices,
    "edges": []
}))
