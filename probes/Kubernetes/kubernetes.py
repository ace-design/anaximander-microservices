from glob import glob
import sys
import os
from collections import namedtuple
from dataclasses import dataclass
from typing import List, Optional
import json

from graphviz import Digraph
import yaml
from dockerfile_parse import DockerfileParser as Dockerfile

Port = namedtuple('Port', ['port', 'target_port'])
Deployment = namedtuple('Deployment', ['name'])

@dataclass
class Port(object):
    name: Optional[str]
    port: int
    target_port: int


@dataclass
class Service(object):
    id: str
    name: str
    ports: List[Port]


@dataclass
class Env(object):
    name: str
    value: str


@dataclass
class Container(object):
    name: str
    image: str
    ports: List[int]
    envs: List[Env]


@dataclass
class Deployment(object):
    name: str
    containers: List[Container]


@dataclass
class Image(object):
    image: str
    context: str
    dockerfile: Dockerfile


deployments: List[Deployment] = []
services: List[Service] = []
images: List[Image] = []

# Find a skaffold.yaml field
def find_with_skaffold(base_path):
    with open(base_path, "r") as f:
        skaffold = yaml.safe_load(f)
        manifests = skaffold['deploy']['kubectl']['manifests']
        # This is not used right now
        for build in skaffold['build']['artifacts']:
            images.append(Image(
                image=build['image'],
                context=build['context'],
                dockerfile=Dockerfile(os.path.normpath(os.path.join(base_path, "../", build['context']))),
            ))

    return manifests, images

def read_k8s(base_path, manifests):
    # Read k8s files
    service_count = 1
    for manifest in manifests:
        for file in glob(os.path.normpath(os.path.join(base_path, manifest))):
            with open(file, "r") as f:
                for doc in yaml.safe_load_all(f):
                    if doc['kind'] == "Service":
                        ports = []
                        for port in doc['spec'].get('ports', []):
                            ports.append(Port(name=port['name'], port=port['port'], target_port=port['targetPort']))
                        services.append(Service(
                            id=f"s{service_count}-{doc['metadata']['name']}",
                            name=doc['metadata']['name'],
                            ports=port,
                        ))
                    elif doc['kind'] == "Deployment":
                        containers = []
                        for container in doc['spec']['template']['spec']['containers']:
                            envs = []
                            for env in container.get('env', []):
                                envs.append(Env(name=env['name'], value=env['value']))

                            containers.append(Container(
                                name=container['name'],
                                image=container['image'],
                                ports=[v.values() for v in container.get('ports', [])],
                                envs=envs,
                            ))

                        deployments.append(Deployment(
                            name=doc['metadata']['name'],
                            containers=containers
                        ))

        return services, deployments


def detect_service_addr(addr):
    #TODO use URI() to parse
    if ':' in addr:
        return addr.split(':')
    return None

def find_service(name):
    for service in services:
        if service.name == name:
            return service

def generate_service_graph(services, deployments):
    service_graph = Digraph()
    for service in services:
        service_graph.node(service.name)
    for deployment in deployments:
        for container in deployment.containers:
            for env in container.envs:
                tentative_service = detect_service_addr(env.value)
                if tentative_service:
                    u = find_service(deployment.name)
                    v = find_service(tentative_service[0])
                    if u and v:
                        service_graph.edge(u.name, v.name)

    service_graph.render('service.dot')

def generate_schema(services):
    schema = {"id": "k8s", "vertices": [], "edges": []}
    for i, service in enumerate(services):
        schema['vertices'].append({
            "id": f"s{i}-{service.name}",
            "type": "service",
            "props": [
                { "name": "name", "value": service.name }
            ]
        })

    for deployment in deployments:
        for container in deployment.containers:
            for env in container.envs:
                tentative_service = detect_service_addr(env.value)
                if tentative_service:
                    u = find_service(deployment.name)
                    v = find_service(tentative_service[0])
                    if u and v:
                        schema['edges'].append({ "from": u.id, "to": v.id, "type": "rpc"})

    return schema


if __name__ == "__main__":
    path = sys.argv[1]
    if path.endswith('skaffold.yaml') or path.endswith('skaffold.yml'):
        path = os.path.join(path, "..")
        manifests, _ = find_with_skaffold(sys.argv[1])
    else:
        manifests = ["*.yaml", "*.yml"]

    services, deployments = read_k8s(path, manifests)
    generate_service_graph(services, deployments)
    schema = generate_schema(services)

    print(json.dumps(schema, sort_keys=True, indent=4))
