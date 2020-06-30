from dataclasses import dataclass
from typing import List
from enum import Enum

# { id: "fig_6b",
#   vertices: [
#     { id: "s1", type: Type.Service, props: [ { name: "name", value: "payment" }] },
#     { id: "s2", type: Type.Service, props: [ { name: "name", value: "orders" }] },
#     { id: "r1", type="route, props: [ { name: "path", value: "/paymentAuth"}, { name: "verb", value: "GET"} ] },
#     { id: "r2", type="route, props: [ { name: "path", value: "/health"}, { name: "verb", value: "GET"} ] },
#     { id: "r3", type="route, props: [ { name: "path", value: "/orders"}, { name: "verb", value: "GET"} ] },
#     { id: "r4", type="route, props: [ { name: "path", value: "/orders"}, { name: "verb", value: "POST"} ] }
#   ],
#   edges: [
#     { from: "s1", to: "r1", type: "exposes"},
#     { from: "s2", to: "r2", type: "exposes"},
#     { from: "s2", to: "r3", type: "exposes"},
#     { from: "s2", to: "r4", type: "exposes"}
#   ]
# }

class EdgeType(Enum):
    Exposes = "exposes"
    Publishes = "publishes"
    Consumes = "consumes"
    Stores = "stores"

class VerticeType(Enum):
    Messaging = "messaging"
    Service = "service"
    Database = "database"


@dataclass
class Prop(object):
    name: str
    value: str


@dataclass
class Vertice(object):
    id: str
    type: str
    props: List[Prop]


@dataclass
class Edge(object):
    _from: Vertice
    to: Vertice
    type: EdgeType

frontend = Vertice(id="frontend", type=VerticeType.Service, props=[Prop(name="name", value="front-end")]),
catalogue = Vertice(id="catalogue", type=VerticeType.Service, props=[Prop(name="name", value="catalogue")]),
orders = Vertice(id="orders", type=VerticeType.Service, props=[Prop(name="name", value="orders")]),
carts = Vertice(id="carts", type=VerticeType.Service, props=[Prop(name="name", value="carts")]),
payment = Vertice(id="payment", type=VerticeType.Service, props=[Prop(name="name", value="payment")]),
queue_master = Vertice(id="queue-master", type=VerticeType.Service, props=[Prop(name="name", value="queue-master")]),
shipping = Vertice(id="shipping", type=VerticeType.Service, props=[Prop(name="name", value="shipping")]),
user = Vertice(id="user", type=VerticeType.Service, props=[Prop(name="name", value="user")]),


carts_db = Vertice(id="carts-db", type=VerticeType.database, props=[Prop(name="name", value="carts-db")]),
orders_db = Vertice(id="orders-db", type=VerticeType.Database, props=[Prop(name="name", value="orders-db")]),
user_db = Vertice(id="user-db", type=VerticeType.Database, props=[Prop(name="name", value="user-db")]),

rabbitmq = Vertice(id="rabbitmq", type=VerticeType.Messaging, props=[Prop(name="name", value="rabbitmq")]),

initial_map = {
    "id": "initial-map",
    "vertices": [
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
    ],
    "edges": [
        Edge(_from=frontend, to=catalogue, type=EdgeType.Exposes),
        Edge(_from=frontend, to=orders, type=EdgeType.Exposes),

        Edge(_from=orders, to=payment, type=EdgeType.Exposes),
        Edge(_from=orders, to=shipping, type=EdgeType.Exposes),
        Edge(_from=orders, to=orders_db, type=EdgeType.Stores),

        Edge(_from=orders, to=carts, type=EdgeType.Exposes),
        Edge(_from=carts, to=carts_db, type=EdgeType.Stores),

        Edge(_from=orders, to=user, type=EdgeType.Exposes),
        Edge(_from=user, to=user_db, type=EdgeType.Stores),

        Edge(_from=shipping, to=rabbitmq, type=EdgeType.Publishes),
        Edge(_from=rabbitmq, to=rabbitmq, type=EdgeType.Consumes),
    ],
}
