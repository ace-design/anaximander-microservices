from glob import glob
import sys
import os
from collections import namedtuple
from dataclasses import dataclass
from typing import List, Optional

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

with open(f"{sys.argv[1]}/skaffold.yaml", "r") as f:
    skaffold = yaml.safe_load(f)
    manifests = skaffold['deploy']['kubectl']['manifests']
    for build in skaffold['build']['artifacts']:
        images.append(Image(
            image=build['image'],
            context=build['context'],
            dockerfile=Dockerfile(f"{sys.argv[1]}/{build['context']}"),
        ))

# Read k8s files
for manifest in manifests:
    for file in glob(os.path.join(sys.argv[1], manifest)):
        with open(file, "r") as f:
            for doc in yaml.safe_load_all(f):
                if doc['kind'] == "Service":
                    ports = []
                    for port in doc['spec'].get('ports', []):
                        ports.append(Port(name=port['name'], port=port['port'], target_port=port['targetPort']))
                    services.append(Service(
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


def detect_service_addr(addr):
    #TODO use URI() to parse
    if ':' in addr:
        return addr.split(':')
    return None

def find_service(name):
    for service in services:
        if service.name == name:
            return service

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

print("Service graph generated in `service.dot`")
