package com.github.acedesign.anaximandermicroservices;

import java.nio.file.Path;
import java.nio.file.Paths;

public class App
{
    public static void main( String[] args )
    {
        Path basePath = Paths.get(args[0]);
        Path springAmqpPath = Paths.get(args[1]);

        try {
            Parser parser = new Parser(basePath, springAmqpPath);
            parser.visitFiles();
        } catch(java.io.IOException e) {
            System.err.println("Failed to parse");
        }

    }
}
