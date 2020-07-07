const fs = require('fs');

let file = process.argv[2];
if (fs.lstatSync(file).isFile()) {
    let data = JSON.parse(fs.readFileSync(file, "utf8"));
    console.log(`digraph ${data.id.replace(/-/g, '_')} {`);
    console.log(formatRoute(mergeRoutes(data)));
    console.log(mapVertices(data));
    console.log(mapEdges(mergeEdges(data)));
    console.log(`}`);
} else {
    console.log("The file given is not a file.")
}

function formatRoute(routesMerged) {
    let result = "";
    routesMerged.forEach(route => {
        let path = route.props.find(v => v.name === "path").value;
        let methods = route.props.filter(v => v.name === "verb");
        let method = methods.map(c => `${c.value.toLocaleUpperCase()} | `).join('');
        method = method.substr(0, method.length - 2);
        result += `${route.id.replace(/-/g, '_')} [label="{${path} | { ${method}}}", shape=record];\n`;
    });
    return result;
}

function mapEdges(edges) {
    let result = "";
    edges.forEach(e => {
        result += `${e.from.replace(/-/g, '_')} -> ${e.to.replace(/-/g, '_')} [style=dashed, label="${e.type}"] \n`;
    });
    return result;
}

function mergeRoutes(data) {
    let routes = data.vertices.filter(v => v.type === "route");
    let routesMerged = [];
    routes.forEach(route => {
        if (routesMerged.some(v => v.props.find(e => e.value === route.props.find(f => f.name === "path").value))) {
            routesMerged.find(v => v.props.find(e => e.value === route.props.find(f => f.name === "path").value)).props.push(route.props.find(g => g.name === "verb"));
        } else {
            routesMerged.push(route);
        }
    });
    return routesMerged;
}

function mapVertices(data) {
    let result = "";
    let vertices = data.vertices.filter(v => v.type !== "route");
    vertices.forEach(v => {
        let name = v.props.find(ve => ve.name === "name").value;
        result += `${v.id.replace(/-/g, '_')} [label="${name}", shape=ellipse];\n`;
    });
    return result;
}

function mergeEdges(data) {
    let routes = data.vertices.filter(v => v.type === "route");
    let edges = data.edges;
    let routesMerged = [];
    let verticesDeleted = [];
    routes.forEach(route => {
        if (routesMerged.some(v => v.props.find(e => e.value === route.props.find(f => f.name === "path").value))) {
            routesMerged.find(v => v.props.find(e => e.value === route.props.find(f => f.name === "path").value)).props.push(route.props.find(g => g.name === "verb"));
            verticesDeleted.push({
                new : routesMerged.find(v => v.props.find(e => e.value === route.props.find(f => f.name === "path").value)).id,
                old : route.id
            })
        } else {
            routesMerged.push(route);
        }
    });
    if (verticesDeleted.length >= 1) {
        edges.forEach(function (part, index) {
            let self = this;
            verticesDeleted.forEach(vd => {
                if (part.from === vd.old) {
                    self[index].from = vd.new;
                } else if (part.to === vd.old) {
                    self[index].to = vd.new;
                }
            })
        }, edges);
    }
    return edges;
}