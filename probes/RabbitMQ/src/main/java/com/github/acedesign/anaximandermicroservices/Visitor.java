package com.github.acedesign.anaximandermicroservices;

import com.github.javaparser.ast.expr.Expression;
import com.github.javaparser.ast.expr.ObjectCreationExpr;
import com.github.javaparser.ast.expr.StringLiteralExpr;
import com.github.javaparser.ast.visitor.VoidVisitorAdapter;
import com.github.javaparser.resolution.UnsolvedSymbolException;
import com.github.javaparser.resolution.types.ResolvedReferenceType;
import com.github.javaparser.resolution.types.ResolvedType;

import java.util.List;

public class Visitor extends VoidVisitorAdapter<Boolean> {
    public List<String> topics;

    @Override
    public void visit(final ObjectCreationExpr n, final Boolean arg) {
        ResolvedType type = null;
        super.visit(n, arg);
        try {
            ResolvedType t = n.getType().resolve();
            ResolvedReferenceType rt = t.asReferenceType();

            // TODO actually check the type
            if(rt.getQualifiedName().equals("org.springframework.amqp.core.TopicExchange")) {
                Expression expr = n.getArgument(0);
                if(expr instanceof StringLiteralExpr) {
                    String v = ((StringLiteralExpr) expr).getValue();
                    this.topics.add(v);
                } else {
                    this.topics.add("");
                }
            }
        } catch(UnsolvedSymbolException e) {
            // noop
        }

    }

}
