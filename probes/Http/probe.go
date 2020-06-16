package http

import (
	"encoding/json"
	"fmt"

	"golang.org/x/tools/go/ssa"
	"github.com/ace-design/anaximander-microservices/util/go/parser"

	log "github.com/sirupsen/logrus"
)

type HttpProbe struct {
	Visitor     *parser.Visitor
	MuxRouters  []string
	MuxHandlers map[string]map[string]bool

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
		}).Info("Got a mux new router")
		probe.MuxRouters = append(probe.MuxRouters, instr.Name())
	case "(*github.com/gorilla/mux.Router).HandleFunc":
		path, err := v.GetValue(instr.Common().Args[1])
		if err != nil {
			log.WithError(err).Fatal("Failed to get value")
		}
		router := instr.Common().Args[0].Name()
		if probe.MuxHandlers[router] == nil {
			probe.MuxHandlers[router] = make(map[string]bool)
		}
		probe.MuxHandlers[router][path] = true
		log.WithFields(log.Fields{
			"name":   instr.Name(),
			"router": router,
			"path":   path,
		}).Info("Registring a route with gorilla's mux router")
	}
}

func (p *HttpProbe) PrintSchema(serviceId string, serviceName string) error {
	schema := &parser.Schema{
		Id: "http-probe",
		Edges: []*parser.Edge{},
		Vertices: []*parser.Vertice{
			&parser.Vertice{
				Id: serviceId,
				Type: parser.Service,
				Props: []*parser.KV{
					&parser.KV{
						Name: parser.Name,
						Value: serviceName,
					},
				},
			},
		},
	}

	i := 0
	for _, routes := range p.MuxHandlers {
		for route, _ := range routes {
			routeName := fmt.Sprintf("route-%d", i)
			vertice := &parser.Vertice{
				Id: routeName,
				Type: parser.Route,
				Props: []*parser.KV{
					&parser.KV{
						Name: parser.Name,
						Value: route,
					},
				},
			}
			schema.Vertices = append(schema.Vertices, vertice)

			edge := &parser.Edge{
				From: serviceId,
				To: routeName,
				Type: parser.Exposes,
			}
			schema.Edges = append(schema.Edges, edge)
			i += 1
		}
	}

	json, err := json.Marshal(schema)
	if err != nil {
		return err
	}


	fmt.Printf("%s\n", json)
	return nil
}
