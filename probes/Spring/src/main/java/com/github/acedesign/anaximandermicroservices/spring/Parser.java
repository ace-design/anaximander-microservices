package com.github.acedesign.anaximandermicroservices.spring;


import com.github.javaparser.ParseResult;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.symbolsolver.utils.SymbolSolverCollectionStrategy;
import com.github.javaparser.utils.ProjectRoot;
import com.github.javaparser.utils.SourceRoot;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;

import java.io.IOException;
import java.nio.file.Path;
import java.util.*;

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
    public Visitor visitFiles() {
        Visitor v = new Visitor();
        v.remoteCalls = new HashMap<String, List<RemoteCall>>();
        v.remoteCallsUsed = new ArrayList<RemoteCallUsage>();
        for(ParseResult<CompilationUnit> parseResult: this.parseResults) {
            if(!parseResult.isSuccessful()) {
                continue;
            }

            Optional<CompilationUnit> optionalCompilationUnit = parseResult.getResult();
            if(optionalCompilationUnit.isEmpty()) {
                continue;
            }
            CompilationUnit cu = optionalCompilationUnit.get();
            cu.accept(v, null);
        }
        return v;
    }
}