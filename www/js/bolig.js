"use strict";

const locations = ["Hele landet", "Region Hovedstaden", "Region Nordjylland", "Region Midtjylland", "Region Syddanmark", "Region Hovedstaden", "Region Sjælland", "Landsdel København by", "København", "Frederiksberg", "Dragør", "Tårnby", "Landsdel Københavns omegn", "Albertslund", "Ballerup", "Brøndby", "Gentofte", "Gladsaxe", "Glostrup", "Herlev", "Hvidovre", "Høje-Taastrup", "Ishøj", "Lyngby-Taarbæk", "Rødovre", "Vallensbæk", "Landsdel Nordsjælland", "Allerød", "Egedal", "Fredensborg", "Frederikssund", "Furesø", "Gribskov", "Halsnæs", "Helsingør", "Hillerød", "Hørsholm", "Rudersdal", "Landsdel Bornholm", "Bornholm", "Christiansø", "Landsdel Østsjælland", "Greve", "Køge", "Lejre", "Roskilde", "Solrød", "Landsdel Vest- og Sydsjælland", "Faxe", "Guldborgsund", "Holbæk", "Kalundborg", "Lolland", "Næstved", "Odsherred", "Ringsted", "Slagelse", "Sorø", "Stevns", "Vordingborg", "Landsdel Fyn", "Assens", "Faaborg-Midtfyn", "Kerteminde", "Langeland", "Middelfart", "Nordfyns", "Nyborg", "Odense", "Svendborg", "Ærø", "Landsdel Sydjylland", "Billund", "Esbjerg", "Fanø", "Fredericia", "Haderslev", "Kolding", "Sønderborg", "Tønder", "Varde", "Vejen", "Vejle", "Aabenraa", "Landsdel Østjylland", "Favrskov", "Hedensted", "Horsens", "Norddjurs", "Odder", "Randers", "Samsø", "Silkeborg", "Skanderborg", "Syddjurs", "Aarhus", "Landsdel Vestjylland", "Herning", "Holstebro", "Ikast-Brande", "Lemvig", "Ringkøbing-Skjern", "Skive", "Struer", "Viborg", "Landsdel Nordjylland", "Brønderslev", "Frederikshavn", "Hjørring", "Jammerbugt", "Læsø", "Mariagerfjord", "Morsø", "Rebild", "Thisted", "Vesthimmerlands", "Aalborg"];

var storage = {}, omraade = [];

const host = "https://storage.googleapis.com/ba7e2966-31de-11e9-819c-b3b1d3be419b/www/";



// ...

function setOptionValue(id, val) {
  var obj = document.getElementById(id), i = 0, j, l = obj.options.length;
  
  while(i < l) {
    if (obj.options[i].value == val) {
      j=i;
      obj.selectedIndex = i; 
      break;
    }
    i++;
  }
  return j; 
};


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


// input: array of [omr20, pris]

// output: array of 

function preprocess(ar) {

    let obj = {};
    
    let data = _.groupBy(ar, c => c[0]);  // f.eks. omr20 
    
    let keys = Object.keys(data);
    
    keys.forEach((c) => { 
        
    data[c] = sameFilter( data[c].map(b => Number(b[1])) ); 
        
    });
    
    return data;
}


// ..

function updateLocation(omr) {
    
    if (omr === "reset") {
        
        omraade = [];
        setOptionValue("location", "vaelg");
        return;
        
    } else if (locations.includes(omr)) {
        
        omraade.push(omr);
    
    } else {
    
        omr = document.getElementById("location").value;
        
        if (locations.includes(omr)) {
            
            omraade.push(omr);
        
        } else {
            
            setOptionValue("location", "vaelg");
        }
    }
        
    statistics();
}



// Multiple omr20 selections

// select: []

function makeData(obj, select) {
    
    let ar = storage[obj.id][select[0]].map((c,i) => { 
        
        let js = {};
        
        js.t = new Date(2004, i, 28);
        
        // j: omr20 index in select
        select.forEach((d,j) => { js[d] = storage[obj.id][select[j]][i]; });
        
        return js;
    }); 
        
    return ar;
}
    

    // ...

function draw(obj) {
    
    let data = [];
    
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
                
        data = makeData(obj, omraade);
        
        mgMultiLine("mg-multiline", data, omraade, obj.title);
    }
    
    clearAction();
}



// ...

function mgMultiLine(id, data, legend, title) {
    
    MG.data_graphic({
        title: title,
        data: data,
        width: 966,
        height: 600,
        right: 220,
        target: ('#' + id),
        legend: legend,
        x_accessor: 't',
        y_accessor: legend

    });  
}


// ...

function dataDraw(obj) {
    
    // WARNING temporary during testing
    
//     storage[obj.id] = preprocess(qpris_hus_kommune[obj.id]);
    
    // ...
    
    if (storage.hasOwnProperty(obj.id)) {
        
        draw(obj);
        
        
    } else {    

        $.ajax({"method": "GET", "url": host + obj.file, "dataType": "text"}).then((r) => {
            
            // TODO
            
            storage[obj.id] = preprocess(filter(obj, r));
                        
            draw(obj);
            
        });
    }
}  


// ...

function statistics(m, type) {
    
    setAction();
    
    m = m || document.getElementById("metric").value;
    type = type || document.getElementById("boligtype").value;
    
    setOptionValue("metric", m);
    setOptionValue("boligtype", type);

    let obj = {};
        
    // title
    
    let title = "";

    title = (m === "qpris") ? "handelspris" : m ;
    
    title = title.charAt(0).toUpperCase() + title.slice(1);
    
    // ...
    
    if (["qpris", "udbudspris", "nedtagningspris"].includes(m)) {
                
        obj = {"id": m + "_" + type + "_kommune", "file": m + "-" + type + "-kommune.csv", "delimiter": "|", "title": title, "y_legend": "DKK pris (price) /m2", "diagram": "mg-multiline"};

    } else if (["udbudstid", "liggetid"].includes(m)) {
        
        obj = {"id": m + "_" + type + "_kommune", "file": m + "-" + type + "-kommune.csv", "delimiter": "|", "title": title, "y_legend": "Antal dage (# days)", "diagram": "mg-multiline"};

    } else if (["udbud", "nedtagne"].includes(m)) {
        
        obj = {"id": m + "_antal_" + type + "_kommune", "file": m + "-antal-" + type + "-kommune.csv", "delimiter": "|", "title": title, "y_legend": "Antal dage (# days)", "diagram": "mg-multiline"};
    } 

    dataDraw(obj);
}


// Shows a modal dialog while fetching data

function setAction(hideBackground) {
    
    let sd = document.getElementById("action").style;

    sd.display = "block";

    if (hideBackground) {
        sd.opacity = "100";
    } else {
        sd.opacity = ".85";
    }  

    let el = document.createElement("i");
        el.setAttribute("class", "fas fa-spinner fa-pulse fa-2x");
    document.getElementById("msg").appendChild(el);
}


// Clears the modal dialog

function clearAction() {
    document.getElementById("msg").textContent = "";
    document.getElementById("action").style.display = "none";
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































































