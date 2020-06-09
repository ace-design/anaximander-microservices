package parser

import (
	"errors"
	"reflect"
	"strconv"

	"go/ast"
	"go/constant"
	"go/token"
	"go/types"

	"golang.org/x/tools/go/ssa"

	log "github.com/sirupsen/logrus"
)

type Node struct {
	Func     *ssa.Function
	Children []*Node
}

type Visitor struct {
	Imports map[string]*ast.ImportSpec
	Package *ast.Package
	Globals map[string]string

	Program       *ssa.Program
	VisitedFuncs  map[*ssa.Function]bool
	VisitedBlocks map[*ssa.BasicBlock]bool
	Root          *Node

	VisitCall func(*Visitor, *ssa.Call)
}

func NewVisitor(p *ast.Package) *Visitor {
	return &Visitor{
		Imports:       make(map[string]*ast.ImportSpec),
		Package:       p,
		VisitedFuncs:  make(map[*ssa.Function]bool),
		VisitedBlocks: make(map[*ssa.BasicBlock]bool),
	}
}

func (v *Visitor) Visit(block *ssa.BasicBlock, node *Node) {
	if _, visited := v.VisitedBlocks[block]; visited {
		return
	}

	for _, instruction := range block.Instrs {
		switch instruction := instruction.(type) {
		case *ssa.DebugRef:
			// noop
		default:
			log.WithFields(log.Fields{
				"instr": instruction,
				"type":  reflect.TypeOf(instruction),
			}).Debug("Instruction")
		}
		switch instruction := instruction.(type) {
		case *ssa.If:
			// visit both sides of if statement
			v.Visit(instruction.Block().Succs[0], node)
			v.Visit(instruction.Block().Succs[1], node)

		case *ssa.Jump:
			// end of a block,
			v.Visit(instruction.Block().Succs[0], node)

		case *ssa.Return:
			// end of a function, let's unwrap all unvisited children nodes
			for _, child := range node.Children {
				if _, visited := v.VisitedFuncs[child.Func]; !visited {
					v.VisitedFuncs[child.Func] = true
					v.Visit(child.Func.Blocks[0], child)
				}
			}
		case *ssa.Go:
			// if static callee is nil, it's a builtin func and we don't care
			if f := instruction.Common().StaticCallee(); f != nil {
				if _, visited := v.VisitedFuncs[f]; !visited {
					v.VisitedFuncs[f] = true
					node.Children = append(node.Children, &Node{
						Func:     f,
						Children: []*Node{},
					})
				}
			}

		case *ssa.Call:
			// ditto, if static callee is nil, it's a builtin func and we don't care
			if f := instruction.Common().StaticCallee(); f != nil {
				if _, visited := v.VisitedFuncs[f]; !visited {
					v.VisitedFuncs[f] = true
					node.Children = append(node.Children, &Node{
						Func:     f,
						Children: []*Node{},
					})
				}
			} else {
				log.Debug("Call not visited because it's a builtin func")
			}
			v.VisitCall(v, instruction)
		}
	}
}

func (v *Visitor) GetValue(arg ssa.Value) (string, error) {
	if c, ok := arg.(*ssa.Const); ok {
		if t, ok := c.Type().Underlying().(*types.Basic); ok {
			switch t.Kind() {
			// TODO other const values https://github.com/golang/tools/blob/213b5e130a7c37d6bcca5383d4e2ea08250014b5/go/ssa/interp/ops.go
			case types.String, types.UntypedString:
				if c.Value.Kind() == constant.String {
					log.Debug("Value is of type string")
					return constant.StringVal(c.Value), nil
				}
				// TODO is this good?
				return string(rune(c.Int64())), nil
			default:
				return "", errors.New("Unsupported type")
			}
		}
	} else if c, ok := arg.(*ssa.UnOp); ok {
		if c.Op == token.MUL {
			log.WithFields(log.Fields{
				"value": c,
			}).Debug("Trying to dereference a value")
			if g, ok := c.X.(*ssa.Global); ok {
				o := g.Object()
				log.WithFields(log.Fields{
					"object": o,
				}).Debug("Checking for global objects (will fail, unimplemented)")
				if v, ok := v.Globals[o.Name()]; ok {
					return v, nil
				}
				// TODO
				return "", errors.New("Failed to find global object (of course, we didn't parse them")
			}
		}
	}

	return "", errors.New("Failed to get value")
}

func (v *Visitor) ParseImports() error {
	for filename, file := range v.Package.Files {
		log.WithFields(log.Fields{
			"filename": filename,
			"file":     file.Name,
		}).Info("Iterating package file")
		for _, i := range file.Imports {
			importName, err := strconv.Unquote(i.Path.Value)
			if err != nil {
				log.Warn("Failed to unquote string")
				return err
			}

			log.WithFields(log.Fields{
				"import": importName,
			}).Info("Adding import")

			v.Imports[importName] = i
		}
	}

	return nil
}
