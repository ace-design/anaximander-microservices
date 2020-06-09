package grpc

import (
	"os"

	go_parser "go/parser"
	"go/token"

	"golang.org/x/tools/go/packages"
	"golang.org/x/tools/go/ssa"
	"golang.org/x/tools/go/ssa/ssautil"

	"github.com/ace-design/anaximander-microservices/utils/go/parser"

	log "github.com/sirupsen/logrus"
)

type GrpcVisitor struct {
	GrpcServers []string

}

func VisitCall(v *GrpcVisitor, instr *ssa.Call) {
	log.WithFields(log.Fields{
		"instr": instr,
	}).Debug("Visiting call")
	call := instr.Value().Common().Value.String()
	if call == "google.golang.org/grpc.NewServer" {
		log.WithFields(log.Fields{
			"name": instr.Name(),
		}).Info("Got a grpc new server")
		v.GrpcServers = append(v.GrpcServers, instr.Name())
	}

	// Checking if we are registring to a grpc server
	if len(v.GrpcServers) > 0 {
		for _, a := range instr.Common().Args {
			for _, server := range v.GrpcServers {
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


func init() {
	log.SetOutput(os.Stdout)
	log.SetLevel(log.DebugLevel)
}

func main() {
	path := os.Args[1]
	log.WithFields(log.Fields{
		"path": path,
	}).Info("Parsing directory")

	fset := token.NewFileSet() // positions are relative to fset
	prog, err := go_parser.ParseDir(fset, path, nil, 0)
	if err != nil {
		log.Error(err)
	}

	for name, pkg := range prog {
		visitor := parser.NewVisitor(pkg)
		visitor.GrpcServers = make([]string, 5)

		log.WithFields(log.Fields{
			"package": name,
			"imports": pkg.Imports,
		}).Info("Visiting package")

		err := visitor.ParseImports()
		if err != nil {
			log.WithError(err).Debug("Failed to parse imports")
		}

		files := []string{}
		for filename, _ := range pkg.Files {
			files = append(files, filename)
		}

		cfg := &packages.Config{Mode: packages.LoadSyntax}
		initial, err := packages.Load(cfg, files...)
		if err != nil {
			log.WithError(err).Fatal("Failed to laod package")
		}

		prog, pkgs := ssautil.AllPackages(initial, ssa.SanityCheckFunctions|ssa.BareInits|ssa.GlobalDebug)
		for i, p := range pkgs {
			if p == nil {
				log.WithFields(log.Fields{
					"package": initial[i],
				}).Fatal("cannot build SSA")
			}
		}
		prog.Build()
		for _, main := range ssautil.MainPackages(pkgs) {
			entrypoint := main.Func("main")
			visitor.Root = &Node{
				Func:     entrypoint,
				Children: []*Node{},
			}
			visitor.VisitedFuncs[entrypoint] = true
			visitor.Visit(entrypoint.Blocks[0], visitor.Root)
		}
	}
}
