"use strict";


// ...

function draw(obj) {
    
    if (obj.diagram === "multiline") {
        
//         let keys = Object.keys(storage[obj.id]);
// 
//         let series = keys.map((c) => { return { "name": c, "values": sameFilter( data[c].map(b => b["v"])) }; });
//         
//         if (! storage.hasOwnProperty("dates")) {
//         
//             // NOTE we know that all data starts with first date 2004M1, and data is sorted in sqlite3 by tid
//             
//             storage.dates = (series[0].values).map((c,i) => new Date(2004, i, 28));
//         }
// 
//         multiLine("multiline", {"dates": storage.dates, "y": obj.y_legend, "title": obj.title, "series": series});
        
    } else if (obj.diagram === "mg-multiline") {
        
        if (omraade.length === 0) { omraade = ["Hele landet"]; }
        
        makeData(obj, omraade);
        
        if (graphdata.length > 0) {
        
            mgMultiLine("mg-multiline", graphdata, omraade, obj.title);
            
            _.delay(clearAction, 500);
            
        } else {
            
            omraade = [];
            
            clearAction();
        }    
    }
}


// ...

function mgMultiLine(id, data, legend, title) {
    
    let margin = {"left": 120, "right": 220};
    let size = {"width": 483, "height": 300};
    
    let omr = omraadeX2(legend, AHEAD);
    
    let y_acc = omr.map((c,i) => ("v"+i));
    
    let nodata = true;
    
//     let marker = [{"t": new Date(), "label": "today"}];

    
    // viewBox = "0 0 (size.width+margin.left+margin.right) 300"
    
    let obj = {
        title: title,
        data: data.map((c) => { return Object.assign({}, c, {"t": new Date(c.t)}); }),
        left: margin.left,
        width: (size.width + margin.left + margin.right),
        height: size.height,
        right: margin.right,
        target: ('#' + id),
        legend: omr,
        x_accessor: 't',
        x_extended_ticks: true,
        y_accessor: y_acc,
        min_y_from_data: true
//         markers: ((forecasting) ? marker : null) 
    };
            
    if (forecasting) {
        
        Object.assign(obj, {active_point_on_lines: true, active_point_size: 2, active_point_accessor: 'v0'});
        
        forecasting_switch = true;
    
    } else if (forecasting_switch) {

        document.getElementById(id).textContent = "";
        
        forecasting_switch = false;
    }
    
    
    MG.data_graphic(obj);  
    
    // table of numbers
        
    let t_y_acc = ["t"].concat(y_acc);
        
    makeTable("table-of-numbers", ([["t"].concat(omr)]).concat(graphdata.map(o => t_y_acc.map(c => o[c])).reverse()) );
        
    // Precision information
    
    // v0: 1M-
    // v1: actual    refer to: omraadeX2()
    
    if (false || forecasting) { 
        
        let gf = graphdata.filter(c => c && c.hasOwnProperty("v0") && c.hasOwnProperty("v1"));
        
        nodata = (gf.length > 0) ? false : true ;
        
        if (! nodata) {
        
            let mean_abs_diff_lag = Number.parseInt(_.mean(gf.map((c,i,a) => ((i>0) ? Math.abs(c.v1 - a[i-1].v1) : -1)).filter(c => c>=0)));

            let mean_abs_diff_1M = Number.parseInt(_.mean(gf.map((c,i,a) => Math.abs(c.v1 - c.v0)).filter(c => c>=0)));    
            
            // add text
                    
            document.getElementById("precision-text-location").textContent = legend[0];

            
            document.getElementById("precision-text-aslast-pct").textContent = Number.parseFloat(100 * mean_abs_diff_lag/_.mean(gf.map(c => c.v1))).toFixed(1);
            
            document.getElementById("precision-text-aslast").textContent = mean_abs_diff_lag;

            
            document.getElementById("precision-text-1M-pct").textContent = Number.parseFloat(100 * mean_abs_diff_1M/_.mean(gf.map(c => c.v0))).toFixed(1);

            document.getElementById("precision-text-1M").textContent = mean_abs_diff_1M;

            
            // TODO loop over these scatter diagrams per pair of omr
            
            MG.data_graphic({
                title: "(1) Præcision (precision)",
                data: gf,
                chart_type: 'point', 
                least_squares: true,
                width: 400,
                height: 400,
                right: 10,
                target: '#diagram-scatter1',
                x_accessor: 'v0',
                y_accessor: 'v1',
                //mouseover: function(d, i) { console.log(d,i); },
                y_rug: true
            });
            
            // ..
            
            MG.data_graphic({
                title: "(2) Præcision (precision)",
                data: gf.map((c) => ({"v0": c.v0, "vy": c.v1-c.v0})),
                chart_type: 'point', 
                least_squares: true,
                width: 400,
                height: 400,
                right: 10,
                target: '#diagram-scatter2',
                x_accessor: 'v0',
                y_accessor: 'vy',
                //mouseover: function(d, i) { console.log(d,i); },
                y_rug: true
            });
        }
    } 
    
    if (! forecasting || nodata) {
        
        document.getElementById("diagram-scatter1").textContent = "";
        document.getElementById("diagram-scatter2").textContent = "";

        document.getElementById("precision-box").className = "pure-g display-none";        
    } 
}


// ...

function dataDraw(obj) {
    
    if (storage.hasOwnProperty(obj.id)) {
        
        draw(obj);
        
    } else {    

        $.ajax({"method": "GET", "url": HOST + obj.file, "dataType": "text"}).then((r) => {
                                    
            r = csvFilter(obj.delimiter, r);
            
            storage[obj.id] = preprocess(r);
                        
            draw(obj);

        }, (err) => {

            console.log(err); 

        });
    }
}  


// source: https://beta.observablehq.com/@mbostock/d3-multi-line-chart

// reponsive: https://ablesense.com/blogs/news/responsive-d3js-charts

// https://web.archive.org/web/20160312004156/https://www.safaribooksonline.com/blog/2014/02/17/building-responsible-visualizations-d3-js/
     
function multiLine(id, data) {
    
    function hover(svg, path) {
        svg
            .style("position", "relative");
        
        if ("ontouchstart" in document) svg
            .style("-webkit-tap-highlight-color", "transparent")
            .on("touchmove", moved)
            .on("touchstart", entered)
            .on("touchend", left)
        else svg
            .on("mousemove", moved)
            .on("mouseenter", entered)
            .on("mouseleave", left);

        var dot = svg.append("g")
            .attr("display", "none");

        dot.append("circle")
            .attr("r", 2.5);

        dot.append("text")
            .style("font", "10px sans-serif")
            .attr("text-anchor", "middle")
            .attr("y", -8);

        function moved() {
            
            d3.event.preventDefault();
            
            var ym = y.invert(d3.event.layerY);
            var xm = x.invert(d3.event.layerX);
            var i1 = d3.bisectLeft(data.dates, xm, 1);
            var i0 = i1 - 1;
            var i = xm - data.dates[i0] > data.dates[i1] - xm ? i1 : i0;
            var s = data.series.reduce((a, b) => Math.abs(a.values[i] - ym) < Math.abs(b.values[i] - ym) ? a : b);
            
            
            path.attr("stroke", d => d === s ? null : "#ddd").filter(d => d === s).raise();
            
            dot.attr("transform", `translate(${x(data.dates[i])},${y(s.values[i])})`);  // orizontal and vertical translation
            
            dot.select("text").text(s.name + " DKK: " + s.values[i] + ", " + data.dates[i].toISOString().substring(0,7));            
        }

        function entered() {
            path.style("mix-blend-mode", null).attr("stroke", "#ddd");
            dot.attr("display", null);
        }

        function left() {
            path.style("mix-blend-mode", "multiply").attr("stroke", null);
            dot.attr("display", "none");
        }
    }
    
    function resize() {
        /* Update graph using new width and height (code below) */
    
        width = parseInt(d3.select("#" + id + "-child").style("width"));
        x = d3.scaleTime()
              .domain(d3.extent(data.dates))
              .range([margin.left, width - margin.right]);
              
        height = parseInt(d3.select("#" + id + "-child").style("height"));
        y = d3.scaleLinear()
        .domain([0, d3.max(data.series, d => d3.max(d.values))]).nice()
        .range([height - margin.bottom, margin.top]);

        hover(svg, path);
    }
 

    var width = 975;
    var height = 600;
    var margin = ({top: 20, right: 20, bottom: 30, left: 40});

    var x = d3.scaleTime()
        .domain(d3.extent(data.dates))
        .range([margin.left, width - margin.right]);

    var y = d3.scaleLinear()
        .domain([0, d3.max(data.series, d => d3.max(d.values))]).nice()
        .range([height - margin.bottom, margin.top]);

    var xAxis = g => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));

    var yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))
        .call(g => g.select(".domain").remove())
        .call(g => g.select(".tick:last-of-type text").clone()
            .attr("x", 3)
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            .text(data.y));

    var line = d3.line()
        .defined(d => !isNaN(d))
        .x((d, i) => x(data.dates[i]))
        .y(d => y(d));


    // <svg viewBox="0 0 975 600" preserveAspectRatio="xMidYMid">

    var svg = d3.select("#" + id).append("svg")
        .attr("id", id + "-child")
        .attr("width", width)
        .attr("height", height);
//         .attr("viewBox", "0 0 975 600")
//         .attr("preserveAspectRatio", "xMidYMid");
        
    svg.append("g")
        .call(xAxis);

    svg.append("g")
        .call(yAxis);

    var path = svg.append("g")
        .attr("fill", "none")
        .attr("class", "stroke-1")
//         .attr("stroke", "steelblue")
//         .attr("stroke-width", 1.5)
//         .attr("stroke-linejoin", "round")
//         .attr("stroke-linecap", "round")
    .selectAll("path")
    .data(data.series)
    .join("path")
        .style("mix-blend-mode", "multiply")
        .attr("d", d => line(d.values)); 
        
    svg.append("g").append("text")
        .attr("x", (width / 2))             
        .attr("y", margin.top)
        .attr("text-anchor", "middle")  
        .style("font-size", "16px") 
        .text(data.title);

    svg.call(hover, path);  // hover(svg, path);

    svg.node();

//     d3.select(window).on('resize', resize);     
}


/*
  . id: DOM id
  . m: matrix with header in first row

*/
function makeTable(id, m, cls) {

    cls = cls || "pure-table pure-table-striped";
    
    var header = m.shift();
    header = ["#"].concat(header);  // add counter element

	var table = document.createElement("table"),
	    thd = document.createElement("thead"),
	    tb = document.createElement("tbody"),
		root, tr, td, trs,th,
		i=0, j=0,
		l=m.length, ll=0;

	for (i = 0; i < l; i++) {
		tr = document.createElement("tr");
		trs = ([i]).concat(m[i]);  // i is a row counter
		ll = trs.length;
		
		for (j = 0; j < ll; j++) {
		   td = document.createElement("td");
		   td.textContent = trs[j];
		   tr.appendChild(td);
		}
		tb.appendChild(tr);
	}
	
	// header
    tr = document.createElement("tr");

	header.forEach((c,k) => {
        
        th = document.createElement("th");
        
        if (k > 1) {
            
          th.textContent = (k % 2 === 0 && forecasting) ? (((lang==="da") ? "Prognoser: " : "Forecasts: ") + c) : (((lang==="da") ? "Historiske: " :"Historical: ") + c) ;
        
        } else {
            
            th.textContent = c;
        }
        
        tr.appendChild(th);
    });
	
    thd.appendChild(tr);
    
	// ...
	table.appendChild(thd);
    
	table.appendChild(tb);
	
	// if l>2500 td: padding 6px
	if (l < 2500) {table.setAttribute("class", cls); }
	
	root = document.getElementById(id);
    root.textContent = "";  // reset
    root.appendChild(table);
}


