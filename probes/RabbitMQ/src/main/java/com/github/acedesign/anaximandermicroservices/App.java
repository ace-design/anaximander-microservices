package com.github.acedesign.anaximandermicroservices;

import com.github.javaparser.ParseResult;
import com.github.javaparser.ast.CompilationUnit;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

public class App
{
    public static void main( String[] args )
    {
        Path basePath = Paths.get(args[0]);
        
        try {
            Parser parser = new Parser(basePath);
            List<String> topics = parser.visitFiles();

            JSONObject obj = new JSONObject();
            obj.put("id", "rabbitmq-map");
            JSONArray edges = new JSONArray();
            for(String topic: topics) {
                JSONObject edge = new JSONObject();
                edge.put("to", topic);
                edge.put("from", null);
                edge.put("type", "exchange");
                edges.add(edge);
            }
            obj.put("edges", edges);
            System.out.print(obj);
        } catch(java.io.IOException e) {
            System.err.println("Failed to parse");
            System.exit(1);
        }

    }
}
