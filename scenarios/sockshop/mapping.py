from dataclasses import dataclass
from typing import Set
from enum import Enum
import sys
import logging
from subprocess import run
import json
import os


logging.basicConfig(level=logging.DEBUG)


class EdgeType(Enum):
    Exposes = "exposes"
    TCP = "tcp"
    Exchanges = "exchanges"


class VerticeType(Enum):
    Messaging = "messaging"
    Service = "service"
    Route = "route"
    Database = "database"


@dataclass(eq=True, frozen=True)
class Prop(object):
    name: str
    value: str


@dataclass(eq=True, frozen=True)
class Vertice(object):
    type: str
    props: Set[Prop]

    @property
    def id(self):
        for prop in self.props:
            if prop.name == 'name':
                return f"service-{prop.value}"


@dataclass(eq=True, frozen=True)
class Edge(object):
    _from: Vertice
    to: Vertice
    type: EdgeType


frontend = Vertice(type=VerticeType.Service, props=frozenset({Prop(name="name", value="front-end")}))
catalogue = Vertice(type=VerticeType.Service, props=frozenset({Prop(name="name", value="catalogue")}))
orders = Vertice(type=VerticeType.Service, props=frozenset({Prop(name="name", value="orders")}))
carts = Vertice(type=VerticeType.Service, props=frozenset({Prop(name="name", value="carts")}))
payment = Vertice(type=VerticeType.Service, props=frozenset({Prop(name="name", value="payment")}))
queue_master = Vertice(type=VerticeType.Service, props=frozenset({Prop(name="name", value="queue-master")}))
shipping = Vertice(type=VerticeType.Service, props=frozenset({Prop(name="name", value="shipping")}))
user = Vertice(type=VerticeType.Service, props=frozenset({Prop(name="name", value="user")}))

edge_router = Vertice(type=VerticeType.Service, props=frozenset({Prop(name="name", value="edge_router")}))
consul = Vertice(type=VerticeType.Service, props=frozenset({Prop(name="name", value="consul")}))
poincare = Vertice(type=VerticeType.Service, props=frozenset({Prop(name="name", value="poincare")}))
wilson = Vertice(type=VerticeType.Service, props=frozenset({Prop(name="name", value="wilson")}))
kalam = Vertice(type=VerticeType.Service, props=frozenset({Prop(name="name", value="kalam")}))

carts_db = Vertice(type=VerticeType.Database, props=frozenset({Prop(name="name", value="carts-db")}))
orders_db = Vertice(type=VerticeType.Database, props=frozenset({Prop(name="name", value="orders-db")}))
user_db = Vertice(type=VerticeType.Database, props=frozenset({Prop(name="name", value="user-db")}))

rabbitmq = Vertice(type=VerticeType.Messaging, props=frozenset({Prop(name="name", value="rabbitmq")}))

def generate_initial_map():
    return {
        "id": "initial-map",
        "vertices": {
            edge_router,
            frontend,
            catalogue,
            orders,
            carts,
            payment,
            queue_master,
            shipping,
            user,

            carts_db,
            orders_db,
            user_db,

            rabbitmq,

            edge_router,
            consul,
            poincare,
            wilson,
            kalam,
        },
        "edges": {
            Edge(_from=frontend, to=catalogue, type=EdgeType.TCP),
            Edge(_from=frontend, to=orders, type=EdgeType.TCP),

            Edge(_from=orders, to=payment, type=EdgeType.TCP),
            Edge(_from=orders, to=shipping, type=EdgeType.TCP),
            Edge(_from=orders, to=orders_db, type=EdgeType.TCP),

            Edge(_from=orders, to=carts, type=EdgeType.TCP),
            Edge(_from=carts, to=carts_db, type=EdgeType.TCP),

            Edge(_from=orders, to=user, type=EdgeType.TCP),
            Edge(_from=user, to=user_db, type=EdgeType.TCP),

            Edge(_from=shipping, to=rabbitmq, type=EdgeType.TCP),
            Edge(_from=queue_master, to=rabbitmq, type=EdgeType.TCP),

            Edge(_from=edge_router, to=frontend, type=EdgeType.TCP),
            Edge(_from=poincare, to=frontend, type=EdgeType.TCP),
            Edge(_from=poincare, to=rabbitmq, type=EdgeType.TCP),
            Edge(_from=wilson, to=rabbitmq, type=EdgeType.TCP),
            Edge(_from=kalam, to=rabbitmq, type=EdgeType.TCP),
        },
    }

def dict_to_map(v):
    edges = set()
    vertices = set()

    for vertice in v.get('vertices', []):
        vertice_type = VerticeType.Service
        if vertice['type'] == "messaging":
            vertice_type = VerticeType.Messaging
        elif vertice['type'] == "database":
            vertice_type = VerticeType.Database
        elif vertice['type'] == "route":
            vertice_type = VerticeType.Route

        props = set()
        for prop in vertice['props']:
            props.add(Prop(**prop))

        vertices.add(Vertice(type=vertice_type, props=frozenset(props)))

    return {'edges': edges, 'vertices': vertices}

def kubernetes_probe(project_dir, current_map):
    logging.debug("Running k8s probe")
    k8s_dir = os.path.join(project_dir, "microservices-demo/deploy/kubernetes/")
    process = run(["docker", "run", "-v", f"{k8s_dir}:/mnt/k8s/", "ax-kubernetes", "python", "kubernetes.py", "/mnt/k8s"], check=True, capture_output=True)
    probe_map = dict_to_map(json.loads(process.stdout))

    # Union of the current map vertices and the k8s map vertices
    vertices = current_map['vertices'] & probe_map['vertices']

    # Remove all "service" type vertices that are not found by the k8s probe
    for vertice in current_map['vertices']:
        if vertice.type != VerticeType.Service:
            vertices.add(vertice)

    return {'id': 'k8s-map', 'edges': current_map['edges'].copy(), 'vertices': vertices}

def rabbitmq_probe(project_dir, current_map):
    shipping_dir = os.path.join(project_dir, "shipping")
    queue_master_dir = os.path.join(project_dir, "queue-master")

    logging.debug("Running rabbitmq probe on shipping")
    shipping_probe = run(["docker", "run", "-v", f"{shipping_dir}:/mnt/k8s/", "ax-rabbitmq", "java", "-jar", "target/rabbitmq-probe-1.0-SNAPSHOT-jar-with-dependencies.jar", "/mnt/k8s/"], check=True, capture_output=True)

    logging.debug("Running rabbitmq probe on queue-master")
    queue_master_probe = run(["docker", "run", "-v", f"{queue_master_dir}:/mnt/k8s/", "ax-rabbitmq", "java", "-jar", "target/rabbitmq-probe-1.0-SNAPSHOT-jar-with-dependencies.jar", "/mnt/k8s/"], check=True, capture_output=True)

    shipping_edge = Edge(_from=shipping, to=rabbitmq, type=EdgeType.TCP)
    queue_master_edge = Edge(_from=queue_master, to=rabbitmq, type=EdgeType.TCP)

    edges = current_map['edges'].copy()
    vertices = current_map['vertices'].copy()
    edges.remove(shipping_edge)
    edges.remove(queue_master_edge)
    vertices.remove(rabbitmq)

    topic_name = json.loads(shipping_probe.stdout)['edges'][0]['to']
    assert topic_name == json.loads(queue_master_probe.stdout)['edges'][0]['to']

    new_rabbitmq = Vertice(type=VerticeType.Messaging, props=frozenset({Prop(name="name", value="rabbitmq"), Prop(name="topic", value=topic_name)}))
    vertices.add(new_rabbitmq)
    edges.update((
        Edge(_from=shipping, to=new_rabbitmq, type=EdgeType.Exchanges),
        Edge(_from=queue_master, to=new_rabbitmq, type=EdgeType.Exchanges),
     ))

    return new_rabbitmq, {'id': 'rabbitmq-map', 'vertices': vertices, 'edges': edges}

def swagger_probe(project_dir, current_map):
    logging.debug("Running swagger probe on orders")
    order_swagger = run(["docker", "run", "-v", f"{project_dir}:/mnt/k8s/", "ax-swagger", "python", "swagger.py", "/mnt/k8s/orders/api-spec/orders.json"], check=True, capture_output=True)

    logging.debug("Running swagger probe on payments")
    payment_swagger = run(["docker", "run", "-v", f"{project_dir}:/mnt/k8s/", "ax-swagger", "python", "swagger.py", "/mnt/k8s/payment/api-spec/payment.json"], check=True, capture_output=True)

    order_map = dict_to_map(json.loads(order_swagger.stdout))
    payment_map = dict_to_map(json.loads(payment_swagger.stdout))

    edges = current_map['edges'].copy()
    for v in order_map['vertices']:
        edges.add(
            Edge(
                _from=orders,
                to=v,
                type=EdgeType.Exposes,
            )
        )

    for v in payment_map['vertices']:
        edges.add(
            Edge(
                _from=orders,
                to=v,
                type=EdgeType.Exposes,
            )
        )

    return {
        'id': 'swagger-map',
        'vertices': current_map['vertices'] | order_map['vertices'] | payment_map['vertices'],
        'edges': edges,
    }


if __name__ == "__main__":
    project_dir = sys.argv[1]
    logging.debug(f"Using {project_dir} as project source")

    initial_map = generate_initial_map()
    k8s_map = kubernetes_probe(project_dir, initial_map)
    new_rabbitmq, rabbitmq_map = rabbitmq_probe(project_dir, k8s_map)
    swagger_map = swagger_probe(project_dir, rabbitmq_map)
