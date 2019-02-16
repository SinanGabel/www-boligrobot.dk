"use strict";


var storage = {};

const host = "https://storage.googleapis.com/ba7e2966-31de-11e9-819c-b3b1d3be419b/www/";


// ...

function filter(obj, csv) {
    
    const d = obj.delimiter;
    
    let ar = [];
    
    return csv.split("\n").filter(c => c.length > 0).map((c) => c.split(d));
}


// sameFilter: "same as last"

function sameFilter(ar) {
    
    const j = ar.findIndex(c => c > 0);
    
    ar[0] = (j >= 0) ? ar[j] : 0.01;
        
    return [ar[0]].concat(ar.map((c,i) => { if (c === 0) { ar[i] = ar[i-1]; }; return ar[i]; }).slice(1));
}


// source: https://beta.observablehq.com/@mbostock/d3-multi-line-chart

     
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

        const dot = svg.append("g")
            .attr("display", "none");

        dot.append("circle")
            .attr("r", 2.5);

        dot.append("text")
            .style("font", "10px sans-serif")
            .attr("text-anchor", "middle")
            .attr("y", -8);

        function moved() {
            d3.event.preventDefault();
            const ym = y.invert(d3.event.layerY);
            const xm = x.invert(d3.event.layerX);
            const i1 = d3.bisectLeft(data.dates, xm, 1);
            const i0 = i1 - 1;
            const i = xm - data.dates[i0] > data.dates[i1] - xm ? i1 : i0;
            const s = data.series.reduce((a, b) => Math.abs(a.values[i] - ym) < Math.abs(b.values[i] - ym) ? a : b);
            path.attr("stroke", d => d === s ? null : "#ddd").filter(d => d === s).raise();
            dot.attr("transform", `translate(${x(data.dates[i])},${y(s.values[i])})`);
            dot.select("text").text(s.name);
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


    const width = 975;
    const height = 600;
    const margin = ({top: 20, right: 20, bottom: 30, left: 40});

    const x = d3.scaleTime()
        .domain(d3.extent(data.dates))
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data.series, d => d3.max(d.values))]).nice()
        .range([height - margin.bottom, margin.top]);

    const xAxis = g => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));

    const yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))
        .call(g => g.select(".domain").remove())
        .call(g => g.select(".tick:last-of-type text").clone()
            .attr("x", 3)
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            .text(data.y));

    const line = d3.line()
        .defined(d => !isNaN(d))
        .x((d, i) => x(data.dates[i]))
        .y(d => y(d));


    const svg = d3.select("#" + id).append("svg")
        .attr("width", width)
        .attr("height", height);
        
    svg.append("g")
        .call(xAxis);

    svg.append("g")
        .call(yAxis);

    const path = svg.append("g")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
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

}


// ...

//   const data = await d3.tsv("https://gist.githubusercontent.com/mbostock/8033015/raw/01e8225d4a65aca6c759fe4b8c77179f446c5815/unemployment.tsv", (d, i, columns) => {
//     return {
//       name: d.name.replace(/, ([\w-]+).*/, " $1"),
//       values: columns.slice(1).map(k => +d[k])
//     };
//   });
//   return {
//     y: "% Unemployment",
//     series: data,
//     dates: data.columns.slice(1).map(d3.timeParse("%Y-%m"))
//   };

function draw(diag, obj) {

    if (diag === "multiline") {
        
        let data = storage[obj.id].map((c) => { return {"o": c[0], "v": Number(c[1])}; });
        
        data = _.groupBy(data, obj.groupkey);  // f.eks. omr20    

        let keys = Object.keys(data);

        let series = keys.map((c) => { return { "name": c, "values": sameFilter( data[c].map(b => b["v"])) }; });
        
        if (! storage.hasOwnProperty("dates")) {
        
            // NOTE we know that all data starts with first date 2004M1, and data is sorted in sqlite3 by tid
            
            storage.dates = (series[0].values).map((c,i) => new Date(2004, i, 28));
        }

        multiLine("multiline", {"dates": storage.dates, "y": obj.y_legend, "title": obj.title, "series": series});
    }
}


// ...

function dataDraw(obj) {
    
    if (storage.hasOwnProperty(obj.id)) {
        
        draw("multiline", obj);
        
        
    } else {    

        $.ajax({"method": "GET", "url": host + obj.file, "dataType": "text"}).then((r) => {
            
            storage[obj.id] = filter(obj, r);
                        
            draw("multiline", obj);
            
        });
    }
}  


// obj: {statement: "sql statement", y_legend: "m2 DKK price", key: "price" , groupkey: "omr20" }

var obj = {"id": "pris_hus_kommune", "file": "pris-hus-kommune.csv", "title": "Realiseret huspriser (actual house prices)" ,"delimiter": "|", "y_legend": "DKK pris (price) /m2", "text": {"dk": "Parcel- og rækkehuse realiseret priser DKK/m2 i kommuner, regioner og landsdele", "en": "" }, "groupkey": "o", "key": "v"};

dataDraw(obj);


obj = {"id": "pris_lejlighed_kommune", "file": "pris-lejlighed-kommune.csv", "delimiter": "|", "y_legend": "DKK pris (price) /m2", "text": {"dk": "Ejerlejligheder realiseret priser DKK/m2 i kommuner, regioner og landsdele", "en": "" }, "groupkey": "o", "key": "v"};

// dataDraw(obj);


obj = {"id": "pris_fritidshus_kommune", "file": "pris-fritidshus-kommune.csv", "delimiter": "|", "y_legend": "DKK pris (price) /m2", "text": {"dk": "Fritidshuse realiseret priser DKK/m2 i kommuner, regioner og landsdele", "en": "" }, "groupkey": "o", "key": "v"};

// dataDraw(obj);


//multiLine("multiline", data_unemployment);

// + can place pre-formatted .json files in google storage for most used data


// NOTE possibly pre-generate this data monthly using cron, and store in google storage instaed of sqlite3

// This is currently 72 tables - (or 36 tables?) => slimmed as only tid, omr20 and the y-value series is required.

// Actually dates is a fixed table which can be placed in its own file

// Use bash script with SQL call into a .csv file

// Else simply use the original downloaded files, and filter

// Browser: put in memory so downloads are only dones once

// Zero values should be changed to "same as last"

// ej1,ej2,ej3,bo1,bo2,geo1,geo2,omr20,tid,udbud,bb1,bb2,p1,p2,pris,bc1,bc2,salgstid,u1,u2,u3,qp1,qp2,qprice,qbo,qso,qtid

//   const data = await d3.tsv("https://gist.githubusercontent.com/mbostock/8033015/raw/01e8225d4a65aca6c759fe4b8c77179f446c5815/unemployment.tsv", (d, i, columns) => {
//     return {
//       name: d.name.replace(/, ([\w-]+).*/, " $1"),
//       values: columns.slice(1).map(k => +d[k])
//     };
//   });
//   return {
//     y: "% Unemployment",
//     series: data,
//     dates: data.columns.slice(1).map(d3.timeParse("%Y-%m"))
//   };


// BM

// dataDraw({"statement": "select omr20,qprice from house where ej2=1 and bo1=1 and bb1=1 and bc1=1 and u3=1 order by omr20,tid asc;", "y_legend": "m2 DKK price", "key": "qprice" , "groupkey": "omr20", "info": {"dk": "Ejerlejligheder realiseret priser DKK/m2 i kommuner, regioner og landsdele", "en": "" }});
// 
// // // ikke nødvendig => brug UDB
// // dataDraw({"statement": "select omr20,qprice from house where ej2=1 and bo1=1 and bb1=1 and bc1=1 and u2=1 order by omr20,tid asc;", "y_legend": "m2 DKK price", "key": "qprice" , "groupkey": "omr20", "info": {"dk": "Ejerlejligheder første udbudspriser DKK/m2 i kommuner, regioner og landsdele", "en": "" }});
// // 
// // // ikke nødvendig => brug UDB
// // dataDraw({"statement": "select omr20,qprice from house where ej2=1 and bo1=1 and bb1=1 and bc1=1 and u1=1 order by omr20,tid asc;", "y_legend": "m2 DKK price", "key": "qprice" , "groupkey": "omr20", "info": {"dk": "Ejerlejligheder nedtagningspriser DKK/m2 i kommuner, regioner og landsdele", "en": "" }});
// 
// 
// // UDB
// 
// dataDraw({"statement": "select omr20,pris from house where ej2=1 and bo1=1 and bb1=1 and bc1=1 and u3=1 order by omr20,tid asc;", "y_legend": "m2 DKK price", "key": "pris" , "groupkey": "omr20", "info": {"dk": "Ejerlejligheder annoncerede nedtagningspriser DKK/m2 i kommuner, regioner og landsdele", "en": "" }});
// 
// dataDraw({"statement": "select omr20,pris from house where ej2=1 and bo1=1 and bb2=1 and bc1=1 and u3=1 order by omr20,tid asc;", "y_legend": "m2 DKK price", "key": "pris" , "groupkey": "omr20", "info": {"dk": "Ejerlejligheder annoncerede udbudspriser DKK/m2 i kommuner, regioner og landsdele", "en": "" }});

// TODO Forskel mellem faktiske priser, annoncerede nedtagningspriser, annoncerede udbudspriser. Medtag også postnumre.


//multiLine("multiline", data1);



// ej1=1: Hus
// ej2=1: Ejerlejlighed
// ej3=1: Fritidshus
// 
// bo1=1: Udbudte boliger
// bo2=1: Nedtagne boliger
// 
// omr20: kommune, region, landsdel
// 
// tid: månedsdata
// 
// udbud: Antal boliger (bo1,bo2)
// 
// bb1=1: Nedtagningspriser
// bb2=1: Udbudspriser
// 
// pris:   annonceret pris
// 
// bc1=1: Liggetider
// bc2=1: Udbudstider
// 
// salgstid: Antal datge (bc1, bc2)
// 
// u1: Nedtagningspris
// u2: Første udbudspris
// u3: Realiseret handelspris
// 
// qprice: faktiske priser (u1,u2,u3)
// 
// qbo: Boliger til salg ultimo
// 
// qso: Solgte boliger
// 
// qtid: Salgstid i dage
// 
// 
//   


// Pr. område, se de forskellige priser

// Sammenlign faktiske salgspriser med annoncerede priser

// histogrammer

// inkluder postnumre

// Filtre: vælge områder mv.

// vælg metricsgraphics til de få multi line grafikker


// function dataDraw(obj) {
//     
//     var data1 = [];
// 
//     $.ajax({ method: "POST", url: "http://localhost:3002", data: '[{"table": "HOUSE", "statement": "' + obj.statement + '"}]'}).then((r) => {
//         
//         r = _.groupBy(r, obj.groupkey);
//             
//         let keys = Object.keys(r);
//         
//         //let dates = r[keys[0]].map(c => new Date(c.tid));  // already sorted in sqlite3 call
//         
//         // NOTE we know that all data starts with first date 2004M1
//         let dates = r[keys[0]].map((c,i) => new Date(2004, i, 28));
//                 
//         let series = keys.map((c) => { return {"name": c, "values": sameFilter(r[c].map(b => b[obj.key])) }; });
//         
//         multiLine("multiline", {"dates": dates, "y": obj.y_legend, "series": series});
//         
//     });
// }  


































































