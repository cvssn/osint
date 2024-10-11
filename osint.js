!function() {
    var margin = {top: 20, right: 120, bottom: 20, left: 140},
        width = 1280 - margin.right - margin.left,
        height = 800 - margin.top - margin.bottom;

    var i = 0,
        duration = 750,
        root;

    var tree = d3.layout.tree()
        .size([height, width]);

    var diagonal = d3.svg.diagonal()
        .projection(function(d) { return [d.y, d.x]; });

    var svg = d3.select("body").append("svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.json("osint.json", function(error, flare) {
        if (error) throw error;
            root = flare;
            root.x0 = height / 2;
            root.y0 = 0;

        function collapse(d) {
            if (d.children) {
                d._children = d.children;
                d._children.forEach(collapse);
                d.children = null;
            }
        }

        root.children.forEach(collapse);

        update(root);
    });

    d3.select(self.frameElement).style("height", "800px");

    function update(source) {
        // calcula o novo layout da árvore
        var nodes = tree.nodes(root).reverse(),
            links = tree.links(nodes);

        // normaliza para profundidade fixa
        nodes.forEach(function(d) { d.y = d.depth * 180; });

        // atualiza os nodes
        var node = svg.selectAll("g.node")
            .data(nodes, function(d) { return d.id || (d.id = ++i); });

        // insere quaisquer novos nodes na posição anterior do pai
        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
            .on("click", click);

        nodeEnter.append("circle")
            .attr("r", 1e-6)
            .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; })
            // .on("click", click);

        node.each(function(d){
            var thisNode = d3.select(this);

            if (d.type === "url") {
                thisNode.append("a")
                    .attr("target", "_blank")
                    .attr("xlink:href", function(d) { return d.url; })
                    .append("text")
                    .attr("dx", 8)
                    .attr("dy", 3)
                    .attr("text-anchor", "start")
                    .text(function(d) { return d.name; });
            }  else {
                thisNode.append("text")
                    .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
                    .attr("dy", ".35em")
                    .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
                    .text(function(d) { return d.name; })
                    .style("fill-opacity", 1e-6);
            }
        });

        // nodes de transição para sua nova posição.
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

        nodeUpdate.select("circle")
            .attr("r", 5)
            .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

        nodeUpdate.select("text")
            .style("fill-opacity", 1);

        // transição dos nodes existentes para a nova posição do pai
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
            .remove();

        nodeExit.select("circle")
            .attr("r", 1e-6);

        nodeExit.select("text")
            .style("fill-opacity", 1e-6);

        // atualiza os links
        var link = svg.selectAll("path.link")
            .data(links, function(d) { return d.target.id; });

        // insere quaisquer novos links na posição anterior do pai
        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", function(d) {
                var o = {
                    x: source.x0,
                    y: source.y0
                };

                return diagonal({
                    source: o,
                    target: o
                });
            });

        // links de transição para sua nova posição
        link.transition()
            .duration(duration)
            .attr("d", diagonal);

        // transição dos nodes existentes para a nova posição do pai
        link.exit().transition()
            .duration(duration)
            .attr("d", function(d) {
                var o = {
                    x: source.x,
                    y: source.y
                };

                return diagonal({
                    source: o,
                    target: o
                });
            }).remove();

        // guarda as posições antigas para transição
        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    // alternar filhos ao clicar
    function click(d) {
        if (d.type === "folder") {
            if (d.children) {
                d._children = d.children;
                d.children = null;
            } else {
                d.children = d._children;
                d._children = null;
            }

            update(d);
        } else {
            if (d.type === "url") {}
        }
    }
}();