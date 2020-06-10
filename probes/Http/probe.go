package http

import (
	"golang.org/x/tools/go/ssa"

	"github.com/ace-design/anaximander-microservices/util/go/parser"

	log "github.com/sirupsen/logrus"
)

type HttpProbe struct {
	Visitor     *parser.Visitor
	MuxRouters  []string
	MuxHandlers map[string][]string

	UsesHttpPkg       bool
	UsesGorillaMuxPkg bool
}

func VisitCall(v *parser.Visitor, instr *ssa.Call) {
	probe, ok := v.Probe.(*HttpProbe)
	if !ok {
		log.Fatal("Failed to cast probe")
	}

	log.WithFields(log.Fields{
		"instr": instr,
	}).Debug("Visiting call")
	call := instr.Value().Common().Value.String()
	switch call {
	case "github.com/gorilla/mux.NewRouter":
		log.WithFields(log.Fields{
			"name": instr.Name(),
		}).Info("Got a grpc new server")
		probe.MuxRouters = append(probe.MuxRouters, instr.Name())
	case "(*github.com/gorilla/mux.Router).HandleFunc":
		path, err := v.GetValue(instr.Common().Args[1])
		if err != nil {
			log.WithError(err).Fatal("Failed to get value")
		}
		router := instr.Common().Args[0].Name()
		probe.MuxHandlers[router] = append(probe.MuxHandlers[router], path)
		log.WithFields(log.Fields{
			"name":   instr.Name(),
			"router": router,
			"path":   path,
		}).Info("Registring a route with gorilla's mux router")
	}
}
