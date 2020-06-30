package com.github.acedesign.anaximandermicroservices;

import com.github.javaparser.ParseResult;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.symbolsolver.utils.SymbolSolverCollectionStrategy;
import com.github.javaparser.utils.ProjectRoot;
import com.github.javaparser.utils.SourceRoot;

import java.io.IOException;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class Parser {
    ProjectRoot sourceRoot;
    List<ParseResult<CompilationUnit>> parseResults;

    public Parser(Path basePath) throws IOException {
        SymbolSolverCollectionStrategy c = new SymbolSolverCollectionStrategy();
        this.sourceRoot = c.collect(basePath);

        for (SourceRoot root : this.sourceRoot.getSourceRoots()) {
            if (this.parseResults == null) {
                this.parseResults = root.tryToParse();
            } else {
                this.parseResults.addAll(root.tryToParse());
            }
        }
    }

    public List<String> visitFiles() {
        List<String> topics = new ArrayList<String>();
        for(ParseResult<CompilationUnit> parseResult: this.parseResults) {
            if(!parseResult.isSuccessful()) {
                continue;
            }

            Optional<CompilationUnit> optionalCompilationUnit = parseResult.getResult();
            if(optionalCompilationUnit.isEmpty()) {
                continue;
            }
            CompilationUnit cu = optionalCompilationUnit.get();
            Visitor v = new Visitor();
            v.topics = new ArrayList<String>();
            cu.accept(v, null);
            topics.addAll(v.topics);
        }

        return topics;
    }
}
