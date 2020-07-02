package com.github.acedesign.anaximandermicroservices.spring;

public class RemoteCallUsage {
    String sourceMethodName;
    String uri;
    String method;
    String remoteMethod;
    String methodName;

    public RemoteCallUsage(String sourceMethodName, String remoteMethod) {
        this.sourceMethodName = sourceMethodName;
        this.remoteMethod = remoteMethod;
    }
}
