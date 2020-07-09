package com.github.acedesign.anaximandermicroservices.spring;

import com.github.javaparser.ast.NodeList;
import com.github.javaparser.ast.body.AnnotationDeclaration;
import com.github.javaparser.ast.body.AnnotationMemberDeclaration;
import com.github.javaparser.ast.body.ClassOrInterfaceDeclaration;
import com.github.javaparser.ast.body.MethodDeclaration;
import com.github.javaparser.ast.expr.*;
import com.github.javaparser.ast.visitor.VoidVisitorAdapter;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;

import java.util.*;

public class Visitor extends VoidVisitorAdapter<Boolean> {
    Map<String, List<RemoteCall>> remoteCalls;
    List<RemoteCallUsage> remoteCallsUsed;

    @Override
    public void visit(final MethodDeclaration n, final Boolean arg) {
        String uri = new String();
        String method = new String();

        NodeList<AnnotationExpr> annotations = n.getAnnotations();
        for(AnnotationExpr annotation : annotations) {
            if(annotation.getNameAsString().equals("RequestMapping")) {
                RequestVisitor v = new RequestVisitor();
                v.remoteCallsUsed = new ArrayList<RemoteCallUsage>();
                n.getBody().ifPresent(l -> l.accept(v, arg));

                for(MemberValuePair pair: ( (NormalAnnotationExpr) annotation).getPairs()) {
                    if(pair.getName().asString().equals("path")) {
                        if(pair.getValue() instanceof StringLiteralExpr) {
                            StringLiteralExpr pairValue = (StringLiteralExpr) pair.getValue();
                            uri = pairValue.asString();
                        } else {
                            uri = "unknown";
                        }
                    }
                    if(pair.getName().asString().equals("method")) {
                        method = pair.getValue().toString();
                    }
                }

                for(RemoteCallUsage r: v.remoteCallsUsed) {
                    r.uri = uri;
                    r.method = method;
                    this.remoteCallsUsed.add(r);
                }
            }
        }
    }

    @Override
    public void visit(final ClassOrInterfaceDeclaration n, final Boolean arg) {
        NodeList<AnnotationExpr> annotations = n.getAnnotations();
        for(AnnotationExpr annotation : annotations) {
            if(annotation.getNameAsString().equals("ConfigurationProperties")) {
                ConfigurationVisitor v = new ConfigurationVisitor();
                v.remoteCalls = new HashMap<String, List<RemoteCall>>();
                n.getMembers().forEach(p -> p.accept(v, arg));
                this.remoteCalls.putAll(v.remoteCalls);
            }
        }
        super.visit(n, arg);
    }

    public void printMap(String serviceName) {
        JSONObject map = new JSONObject();

        JSONArray edges = new JSONArray();
        JSONArray vertices = new JSONArray();

        for(RemoteCallUsage call : this.remoteCallsUsed) {
            JSONObject vertice = new JSONObject();
            String verbString;
            if(call.method.equals("RequestMethod.POST")) {
                verbString = "POST";
            } else if(call.method.equals("RequestMethod.GET")) {
                verbString = "GET";
            } else {
                verbString = "unknown";
            }
            vertice.put("id", "route-" + verbString + "-" + call.uri);
            vertice.put("type", "route");
            JSONArray props = new JSONArray();

            JSONObject verb = new JSONObject();
            verb.put("name", "verb");
            verb.put("value", verbString);


            JSONObject path = new JSONObject();
            path.put("name", "path");
            path.put("value", call.uri);

            props.add(verb);
            props.add(path);
            vertice.put("props", props);

            JSONObject edge = new JSONObject();
            edge.put("from", "service-" + serviceName);
            edge.put("to", "route-" + verbString + "-" + call.uri);
            edge.put("type", "exposes");
            edges.add(edge);

            vertices.add(vertice);
            Set<String> services = new HashSet<String>();
            List<RemoteCall> remoteCalls = this.remoteCalls.get(call.sourceMethodName);
            if(remoteCalls != null) {
                for(RemoteCall r: remoteCalls) {
                    if(!services.contains(r.hostname)) {
                        vertice = new JSONObject();
                        vertice.put("id", "service-" + r.hostname);
                        vertice.put("type", "service");
                        props = new JSONArray();
                        JSONObject name = new JSONObject();
                        name.put("name", "name");
                        name.put("value", r.hostname);
                        props.add(name);
                        vertice.put("props", props);
                        vertices.add(vertice);
                    }

                    vertice = new JSONObject();
                    vertice.put("id", "route-" + call.remoteMethod + "-" + r.uri);
                    vertice.put("type", "route");

                    verb = new JSONObject();
                    verb.put("name", "verb");
                    verb.put("value", call.remoteMethod);

                    path = new JSONObject();
                    path.put("name", "path");
                    path.put("value", r.uri);

                    props = new JSONArray();
                    props.add(verb);
                    props.add(path);
                    vertice.put("props", props);
                    vertices.add(vertice);

                    edge = new JSONObject();
                    edge.put("from", "route-" + verbString + "-" + call.uri);
                    edge.put("to", "route-"  + call.remoteMethod + "-" + r.uri);
                    edge.put("type", "calls");
                    edges.add(edge);

                    edge = new JSONObject();
                    edge.put("from","service-" + r.hostname);
                    edge.put("to", "route-"  + call.remoteMethod + "-" + r.uri);
                    edge.put("type", "exposes");
                    edges.add(edge);
                }
            }
        }

        JSONObject baseService = new JSONObject();
        baseService.put("id", "service-" + serviceName);
        baseService.put("type", "service");

        JSONArray props = new JSONArray();
        JSONObject prop = new JSONObject();
        prop.put("name", "name");
        prop.put("value", serviceName);
        props.add(prop);
        baseService.put("props", props);
        vertices.add(baseService);


        map.put("edges", edges);
        map.put("vertices", vertices);
        map.put("id", "spring-map");
        System.out.println(map.toString());
    }
}