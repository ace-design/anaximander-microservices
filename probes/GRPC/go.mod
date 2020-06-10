module github.com/ace-design/anaximander-microservices/probes/GRPC

go 1.14

require (
	contrib.go.opencensus.io/exporter/jaeger v0.2.0 // indirect
	contrib.go.opencensus.io/exporter/stackdriver v0.13.1 // indirect
	github.com/GoogleCloudPlatform/microservices-demo v0.2.0 // indirect
	github.com/ace-design/anaximander-microservices/utils/go/parser v0.0.0-00010101000000-000000000000
	github.com/google/pprof v0.0.0-20200604032702-163a225fb653 // indirect
	github.com/googleapis/gax-go v1.0.3 // indirect
	github.com/gorilla/mux v1.7.4 // indirect
	github.com/prometheus/client_golang v1.6.0 // indirect
	github.com/sirupsen/logrus v1.6.0
	github.com/streadway/handy v0.0.0-20200128134331-0f66f006fb2e // indirect
	github.com/weaveworks/common v0.0.0-20200512154658-384f10054ec5 // indirect
	golang.org/x/tools v0.0.0-20200609124132-5359b67ffbdf
)

replace github.com/ace-design/anaximander-microservices/utils/go/parser => /home/jpcaissy/src/anaximander-microservices/util/go/parser
replace github.com/ace-design/anaximander-microservices/probes/GRPC => /home/jpcaissy/src/anaximander-microservices/probes/GRPC
