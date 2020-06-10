package main

import (
	"os"

	"github.com/ace-design/anaximander-microservices/util/go/parser"
	probe "github.com/ace-design/anaximander-microservices/probes/GRPC"

	log "github.com/sirupsen/logrus"
)

func init() {
	log.SetOutput(os.Stdout)
	log.SetLevel(log.DebugLevel)
}

func main() {
	path := os.Args[1]
	log.WithFields(log.Fields{
		"path": path,
	}).Info("Parsing directory")

	visitor := parser.NewVisitor(probe.VisitCall)
	visitor.Probe = &probe.GrpcProbe{}

	parser.Parse(path, visitor)
}
