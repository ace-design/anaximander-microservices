package grpc

import (
	"golang.org/x/tools/go/ssa"

	"github.com/ace-design/anaximander-microservices/utils/go/parser"

	log "github.com/sirupsen/logrus"
)

type GrpcProbe struct {
	Visitor *parser.Visitor
	GrpcServers []string
}

func VisitCall(v *parser.Visitor, instr *ssa.Call) {
	probe, ok := v.Probe.(*GrpcProbe)
	if !ok {
		log.Fatal("Failed to cast probe")
	}

	log.WithFields(log.Fields{
		"instr": instr,
	}).Debug("Visiting call")
	call := instr.Value().Common().Value.String()
	if call == "google.golang.org/grpc.NewServer" {
		log.WithFields(log.Fields{
			"name": instr.Name(),
		}).Info("Got a grpc new server")
		probe.GrpcServers = append(probe.GrpcServers, instr.Name())
	}

	// Checking if we are registring to a grpc server
	if len(probe.GrpcServers) > 0 {
		for _, a := range instr.Common().Args {
			for _, server := range probe.GrpcServers {
				if a.Name() == server {
					log.WithFields(log.Fields{
						"grpc": server,
						"method": instr.String(),
					}).Info("Found a method that seems to be registring a service to a grpc server")
					break
				}
			}
		}
	}
}
