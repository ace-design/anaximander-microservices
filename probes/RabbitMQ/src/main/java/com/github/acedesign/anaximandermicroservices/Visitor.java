package com.github.acedesign.anaximandermicroservices;

import com.github.javaparser.ast.expr.ObjectCreationExpr;
import com.github.javaparser.ast.visitor.VoidVisitorAdapter;
import com.github.javaparser.resolution.UnsolvedSymbolException;
import com.github.javaparser.resolution.types.ResolvedReferenceType;
import com.github.javaparser.resolution.types.ResolvedType;

public class Visitor extends VoidVisitorAdapter<Boolean> {
    @Override
    public void visit(final ObjectCreationExpr n, final Boolean arg) {
        ResolvedType type = null;
        super.visit(n, arg);
        try {
            ResolvedType t = n.getType().resolve();
            ResolvedReferenceType rt = t.asReferenceType();

            // TODO actually check the type
            if(rt.getQualifiedName().equals("org.springframework.amqp.core.TopicExchange")) {
                System.out.println("Got TopicExchange on node " + n);
            }
        } catch(UnsolvedSymbolException e) {
            // noop
        }

    }

}
