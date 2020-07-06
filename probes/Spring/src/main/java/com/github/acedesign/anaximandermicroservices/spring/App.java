package com.github.acedesign.anaximandermicroservices.spring;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;

public class App 
{
    public static void main( String[] args ) throws IOException {
        Path basePath = Paths.get(args[0]);
        Parser parser = new Parser(basePath);
        Visitor visitor = parser.visitFiles();
        visitor.printMap();
    }
}
