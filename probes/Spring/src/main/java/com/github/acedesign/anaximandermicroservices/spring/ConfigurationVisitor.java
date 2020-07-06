package com.github.acedesign.anaximandermicroservices.spring;

import com.github.javaparser.ast.body.MethodDeclaration;
import com.github.javaparser.ast.expr.ObjectCreationExpr;
import com.github.javaparser.ast.expr.StringLiteralExpr;
import com.github.javaparser.ast.visitor.VoidVisitorAdapter;
import com.github.javaparser.resolution.UnsolvedSymbolException;
import com.github.javaparser.resolution.types.ResolvedReferenceType;
import com.github.javaparser.resolution.types.ResolvedType;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Stack;

public class ConfigurationVisitor  extends VoidVisitorAdapter<Boolean> {
    Map<String, List<RemoteCall>> remoteCalls;
    List<RemoteCall> callStack;

    @Override
    public void visit(final MethodDeclaration n, final Boolean arg) {
        this.callStack = new Stack<RemoteCall>();
        super.visit(n, arg);
        this.remoteCalls.put(n.getNameAsString(), this.callStack);
    }

    @Override
    public void visit(final ObjectCreationExpr n, final Boolean arg) {
        super.visit(n, arg);
        try {
            ResolvedType t = n.getType().resolve();
            ResolvedReferenceType rt = t.asReferenceType();
            String name = rt.getQualifiedName();
            if(name.equals("works.weave.socks.orders.config.OrdersConfigurationProperties.ServiceUri")) {
                ObjectCreationExpr hostnameExpr = (ObjectCreationExpr) n.getArgument(0);
                StringLiteralExpr hostname = (StringLiteralExpr) hostnameExpr.getArgument(0);

                StringLiteralExpr endpoint = (StringLiteralExpr) n.getArgument(2);
                String methodCall = n.getType().asString();
                this.callStack.add(new RemoteCall(hostname.asString(), endpoint.asString()));
            }
        } catch(UnsolvedSymbolException e) {
            // noop
        }
    }
}
