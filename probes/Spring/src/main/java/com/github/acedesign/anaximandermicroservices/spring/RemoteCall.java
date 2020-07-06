package com.github.acedesign.anaximandermicroservices.spring;

public class RemoteCall {
    String hostname;
    String uri;

    public RemoteCall(String hostname, String uri) {
        this.hostname = hostname;
        this.uri = uri;
    }
}
