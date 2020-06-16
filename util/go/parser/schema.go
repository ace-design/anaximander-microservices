package parser

const Service = "service"
const Route = "route"
const Name = "name"
const Exposes = "exposes"

type Schema struct {
	Id string `json:"id"`
	Vertices []*Vertice `json:"vertices"`
	Edges []*Edge `json:"edges"`
}

type Vertice struct {
	Id string `json:"id"`
	Type string `json:"type"`
	Props []*KV `json:"props"`
}

type Edge struct {
	From string `json:"from"`
	To string `json:"to"`
	Type string `json:"type"`
}

type KV struct {
	Name string `json:"name"`
	Value string `json:"value"`
}
