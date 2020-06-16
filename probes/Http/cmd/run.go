package main

import (
	"fmt"
	"flag"
	"os"

	probe "github.com/ace-design/anaximander-microservices/probes/Http"
	"github.com/ace-design/anaximander-microservices/util/go/parser"

	log "github.com/sirupsen/logrus"
)

type Config struct {
	serviceName string
	serviceId string
	debug bool
}

var runtimeConfig Config

func init() {
	flag.Usage = func() {
		fmt.Fprintf(os.Stderr, "Usage of %s [name of directory]:\n", os.Args[0])
		flag.PrintDefaults()
		fmt.Fprintf(os.Stderr, "  [name of directory]\n\n")
		fmt.Fprintf(os.Stderr, "Example: %s -d /tmp/my_awesome_project\n", os.Args[0])
	}
	flag.StringVar(&runtimeConfig.serviceName, "name", "", "Service name")
	flag.StringVar(&runtimeConfig.serviceId, "id", "", "Service id")
	flag.BoolVar(&runtimeConfig.debug, "debug", false, "Debug")
}

func main() {
	flag.Parse()
	log.SetOutput(os.Stderr)
	if !runtimeConfig.debug {
		log.SetLevel(log.WarnLevel)
	}

	if runtimeConfig.serviceName == "" {
		fmt.Fprintf(os.Stderr, "Service name is required\n")
		flag.Usage()
		os.Exit(1)
	}

	if runtimeConfig.serviceId == "" {
		fmt.Fprintf(os.Stderr, "Service id is required\n")
		flag.Usage()
		os.Exit(1)
	}

	if flag.NArg() == 0 {
		fmt.Fprintf(os.Stderr, "Path to service is required\n")
		flag.Usage()
		os.Exit(1)
	}

	path := os.Args[len(os.Args) - 1]
	log.WithFields(log.Fields{
		"path": path,
	}).Info("Parsing directory")

	visitor := parser.NewVisitor(probe.VisitCall)
	probe := &probe.HttpProbe{}
	probe.MuxHandlers = make(map[string]map[string]bool)
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

	err := probe.PrintSchema(runtimeConfig.serviceName, runtimeConfig.serviceId)
	if err != nil {
		log.WithError(err).Fatal("Failed to marshal to json")
	}
}
