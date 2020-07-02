package com.github.acedesign.anaximandermicroservices.spring;

import com.github.javaparser.ast.NodeList;
import com.github.javaparser.ast.expr.Expression;
import com.github.javaparser.ast.expr.MethodCallExpr;
import com.github.javaparser.ast.expr.NameExpr;
import com.github.javaparser.ast.visitor.VoidVisitorAdapter;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public class RequestVisitor extends VoidVisitorAdapter<Boolean> {
    List<RemoteCallUsage> remoteCallsUsed;

    @Override
    public void visit(final MethodCallExpr n, final Boolean arg) {
        super.visit(n, arg);
        Optional<Expression> scope = n.getScope();
        if(scope.isPresent()) {
            Expression name = scope.get();
            if(name instanceof NameExpr) {
                String scopeName = name.asNameExpr().getNameAsString();
                String nodeName = n.getNameAsString();
                if (scopeName.equals("asyncGetService")) {
                    if (nodeName.equals("postResource") || nodeName.equals("getResource")) {
                        Expression host = n.getArgument(0);
                        if(host instanceof MethodCallExpr) {
                            String hostMethodName = ((MethodCallExpr) host).getNameAsString();
                            String remoteMethod;
                            if(nodeName.equals("postResource")) {
                                remoteMethod = "POST";
                            } else if(nodeName.equals("getResource")) {
                                remoteMethod = "GET";
                            } else {
                                remoteMethod = null;
                            }
                            this.remoteCallsUsed.add(new RemoteCallUsage(hostMethodName, remoteMethod));
                        }
                    }
                }
            }
        }
    }
}