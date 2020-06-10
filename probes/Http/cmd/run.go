package main

import (
	"os"

	probe "github.com/ace-design/anaximander-microservices/probes/Http"
	"github.com/ace-design/anaximander-microservices/util/go/parser"

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
	probe := &probe.HttpProbe{}
	probe.MuxHandlers = make(map[string][]string)
	visitor.Probe = probe

	parser.Parse(path, visitor)

	for importName, _ := range visitor.Imports {
		if importName == "net/http" {
			probe.UsesHttpPkg = true
		}
		if importName == "github.com/gorilla/mux" {
			probe.UsesGorillaMuxPkg = true
		}
	}
}
