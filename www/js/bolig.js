"use strict";


// name: Aarhus (geo), value: Århus (udb, bm)

var storage={}, dates={}, omraade=[], omraade2x=[], graphdata=[], locations=[], postnumre=[], kommuner=[];

var forecasting = true;

const regex = /[0-9]/g;

const host = "https://storage.googleapis.com/ba7e2966-31de-11e9-819c-b3b1d3be419b/www/v1/";

const ahead = "1M-";

// var init_viewBox = true;


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


// ...

function optionElements(id, ar) {

    let root = document.getElementById(id), op;

    ar.forEach((f) => {

        op = document.createElement("option");
        op.setAttribute("value", f);
        op.textContent = f;
        
        root.appendChild(op);    
    });            
}


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

/* 
 . note: remember to declare id's globally, and to call clearTimeout() each time message is called
 . ...
*/ 
function message(id, txt, t) {
    
    t = t || 10000;

    let h = document.getElementById(id);
    
    // set message text 
    h.textContent += "Alert: " + txt + " ";
    h.style.display = "block";
    
    // remove text after time t
    setTimeout( function() { 
        
        h.textContent = "";
        h.style.display = "none";
        
    }, t);  // note the need to wrap in a function()
}


// toggleDisplay("dk", "en") or toggleDisplay("en", "dk")

function toggleDisplay(fra, til) {
    
    let block = document.getElementsByName(fra);
    let none = document.getElementsByName(til);
    

    block.forEach(c => {c.className = "display-none";});
    none.forEach(c => {c.className = "display-block";});

}

function changeLanguage(l) {
    
    let dk = (l.textContent === "Dansk");
    
    l.textContent = (dk) ? "English" : "Dansk" ;
    
    if (dk) {
        
        toggleDisplay("en", "dk");
        
    } else {
        
        toggleDisplay("dk", "en");
    }
}


// plus 1

function datePlus(d) {
    
    let dt = d.split("-");
    
    if (dt[1] === "01") {
        
        dt[1] = "02";
        dt[2] = "28";
        
    } else if (dt[1] === "02") {
        
        dt[1] = "03";
        dt[2] = "30";

    } else if (dt[1] === "12") {
        
        dt[0] = Number(dt[0]) + 1;
        dt[1] = "01";
        dt[2] = "30";
        
    } else {
        
        dt[1] = Number(dt[1]) + 1 ;  // e.g. "03" + 1 => 4
        
        dt[1] = (dt[1] > 9) ? dt[1] : "0" + dt[1] ;
    }
    
    return dt.join("-");
}


// ...

function csvFilter(delimiter, csv) {
    
    const d = delimiter;
    
    let ar = [];
    
    return csv.split("\n").filter(c => c.length > 0).map((c) => c.split(d));
}


// // sameFilter: "same as last"
// 
// function sameFilter(ar) {
//     
//     const j = ar.findIndex(c => c > 0);
//     
//     ar[0] = (j >= 0) ? ar[j] : 0.01;
//         
//     return [ar[0]].concat(ar.map((c,i) => { if (c === 0) { ar[i] = ar[i-1]; }; return ar[i]; }).slice(1));
// }


// input: array of [omr20, pris]

// output: array of 

function preprocess(ar) {

    let ex = {};
    
    let data = _.groupBy(ar, c => c[0]);  // f.eks. omr20 
    
    // keys: locations
    
    let keys = Object.keys(data);
    
    keys.forEach((c) => { 
                
        if (forecasting) {
            
            ex[c] = data[c].map((b) => {return [b[1],b[2]]});
            ex[ahead + c] = data[c].map((b) => {return [datePlus(b[1]),b[3]]});   // WARNING 1M currently wrong date therefore this datePlus()
                        
        } else {
            
            data[c] = data[c].map((b) => {return [b[1],b[2]]});
        }
    });
        
    if (forecasting) {

        return ex;

    } else {

        return data;
    }
}


// ..

function updateLocation(omr) {
    
//     if (forecasting) { 
//         
//         omraade = []; 
//         graphdata = [];
//     } 
        
    if (omr === "reset") {
        
        omraade = [];
        graphdata = [];
        
        setOptionValue("location", "vaelg");
        
        clearAction();
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
    
    // ...
    
//     let className = [(document.getElementById("button-lejlighed").className).includes("active"), 
//                      (document.getElementById("button-hus").className).includes("active"), 
//                      (document.getElementById("button-fritidshus").className).includes("active")];
//     
//     let type = ["lejlighed", "hus", "fritidshus"];
    
    // ...
        
//     statistics(null, type[ className.indexOf(true) ]);
}



// NOTE: (1) multi omraade select ok (handled with multiple calls to makeDataX()); (2) unordered dates ok (handled via diff_dates and dates)

// select == omraade

// TODO possibly make var instead

function omraadeX2(omr, t) {
    
    return (omr.map(c => (t + c))).concat(omr);
}


// ...

function makeData(obj, select) {

    if (graphdata.length > 0) {
        
        if (forecasting) {
            
            makeDataX(obj, omraadeX2(select, ahead));
        
        } else {
        
            makeDataX(obj, select);            
        }
        
    } else {
        
        if (forecasting) {
        
            omraadeX2(select, ahead).forEach((c,i,ar) => { makeDataX(obj, ar.slice(0, i+1)); });
        
        } else {

            select.forEach((c,i,ar) => { makeDataX(obj, ar.slice(0, i+1)); });            
        }    
    }
    
    return graphdata;
}   


// ...
    
function makeDataX(obj, select) {
    
    let ar = [], diff_dates = [], json = {}, js = {}, k = "", oo = {};
    
    if (! storage[obj.id].hasOwnProperty(select[select.length-1]) || _.isEmpty(storage[obj.id][select[select.length-1]])) { 
                
        message("diagram-message", ("No data for " + select[select.length-1] + ": " + obj.id + "."), 60000);

        console.log("No data for: ", select[select.length-1]); 
        
        omraade.pop();  // remove last element

        return; 
    }
    
    if (graphdata.length > 0) {
        
        ar = storage[obj.id][select[select.length-1]];
        
        oo = _.fromPairs(ar);
        
        diff_dates = _.difference(Object.keys(oo), dates);

        k = "v" + (select.length - 1);
        
        graphdata.map((c,i) => { 
            
            if (oo[c.t]) {  // date should fit, else skip, currently wrong
            
                js={}; 
                js[k] = Number(oo[c.t]); 
                return Object.assign(c, js); 
            
            } else {
                
                return c;
            }
        }); 
        
        if (diff_dates.length > 0) {
            
            json = _.groupBy(ar, c => c[0]);
            
            ar = diff_dates.map(t => json[t][0]);  // [[t0,v0],[t1,v1]...]
            
            ar.forEach((c) => {
                
                js = {};
                js.t = c[0];
                js[k] = Number(c[1]);
                
                graphdata.push(js);
            });
        } 
        
    } else {
        
        select.forEach((d,i) => {
            
            k = "v"+i;
                        
            storage[obj.id][d].forEach((c) => { 
                
                js = {};
                js.t = c[0];
                js[k] = Number(c[1]);
            
                ar.push(js);
            });
        });
        
        json = _.groupBy(ar, c => c.t);
        
        dates = Object.keys(json);
        
        graphdata = dates.map(c => json[c][0]);
    }    

    ar = [];
        
//  return graphdata;     
}
    

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
    
    // viewBox = "0 0 (size.width+margin.left+margin.right) 300"
            
    MG.data_graphic({
        title: title,
        data: data.map((c) => { return Object.assign({}, c, {"t": new Date(c.t)}); }),
        left: margin.left,
        width: (size.width + margin.left + margin.right),
        height: size.height,
        right: margin.right,
        target: ('#' + id),
        legend: ((forecasting) ? omraadeX2(legend, ahead) : legend),
        x_accessor: 't',
        x_extended_ticks: true,
        y_accessor: (((forecasting) ? _.range(0, 2*legend.length) : legend)).map((c,i) => ("v"+i)),
        min_y_from_data: true
    });  
}


// ...

function dataDraw(obj) {
    
    if (storage.hasOwnProperty(obj.id)) {
        
        draw(obj);
        
    } else {    

        $.ajax({"method": "GET", "url": host + obj.file, "dataType": "text"}).then((r) => {
                        
            r = csvFilter(obj.delimiter, r);
            
            storage[obj.id] = preprocess(r);
                        
            draw(obj);
        });
    }
}  


// f: forecasting boolean

function makeRequestObject(f, m, type) {
    
    let obj = {};
    
    let title="", y_legend="", filnavn="", id="", 
        bm = true;
        
    // kvartalsdata
        
    bm = (["salg","salgstid","pris"].includes(m)) ? true : false ; 
    
    // Forecasts or Historic information
    
//     ai = (document.getElementById("data-forecast").className).includes("active");

    
    // postnumre findes kun for kvartalsdata
    
    if (bm) { 
        
        optionElements("zip", postnumre);
        
    } else {
     
        document.getElementById("zip").textContent = "";
    }
    
    // ...
    
    if (["pris", "udbud-pris", "nedtagne-pris"].includes(m)) {
        
        y_legend = "DKK pr. m2 (price/m2)";
                        
        if (bm) {
        
            id = type + "-realiseret-" + m; 
            
            filnavn = id + ".csv";
            
            title = "Handelspris, DKK pr. m2 (traded price/m2)";
            
        } else if (! f) {

            id = type + "-annonce-" + m; 

            filnavn = id + ".csv";
            
            title = "Internet " + ((m === "udbud-pris") ? "udbudspris" : "nedtagningspris") + ", DKK pr. m2 (price/m2)";
            
        } else if (f && ["udbud-pris", "nedtagne-pris"].includes(m)) {

            id = type + "-prognose-" + m; 

            filnavn = id + ".csv";
            
            title = "Prognose " + ((m === "udbud-pris") ? "udbudspris" : "nedtagningspris") + ", DKK pr. m2 (price/m2)";
        }
        
        
        obj = {"id": id, "file": filnavn, "delimiter": "|", "title": title, "y_legend": y_legend, "diagram": "mg-multiline"};

    } else if (["salgstid", "udbud-tid", "nedtagne-tid"].includes(m)) {

        y_legend = "antal dage (# days)";
        
        title = title + " " + y_legend;
        
        if (bm) {
        
            id = type + "-realiseret-salgstid"; 
            
            filnavn = id + ".csv";
            
            title = "Salgstid i dage (sales time, # days)";
            
        } else {

            id = type + "-annonce-" + m; 

            filnavn = id + ".csv";
            
            title = "Internet " + ((m === "udbud-tid") ? "udbudstid" : "annoncetid ved nedtagning")  + " i dage (# days advertised)";
        }        
        
        obj = {"id": id, "file": filnavn, "delimiter": "|", "title": title, "y_legend": y_legend, "diagram": "mg-multiline"};

    } else if (["salg", "udbud", "nedtagne"].includes(m)) {

        y_legend = "antal boliger (# homes)";
                
        if (bm) {
        
            id = type + "-realiseret-" + m; 
            
            filnavn = id + ".csv";
            
            title = "Antal solgte pr. kvartal (# traded homes quarterly)";
            
        } else {

            id = type + "-annonce-" + m; 

            filnavn = id + ".csv";
            
            title = "Internet, antal " + m + " pr. måned (# homes monthly)";
        }
        
        obj = {"id": id, "file": filnavn, "delimiter": "|", "title": title, "y_legend": y_legend, "diagram": "mg-multiline"};
    } 

    return obj;
}






// TODO when clicking AI or History => update: id="metric"

function statistics(m, type) {
    
    m = m || document.getElementById("metric").value;
    type = type ||document.getElementById("boligtype").value;
        
    setOptionValue("metric", m);
    setOptionValue("boligtype", type);
    
    let obj = {};
    
    // button colors
    
//     if (type === "lejlighed") {
//         
//         document.getElementById("button-hus").className = "pure-button";
//         document.getElementById("button-fritidshus").className = "pure-button";
//         
//     } else if (type === "hus") {
//         
//         document.getElementById("button-lejlighed").className = "pure-button";
//         document.getElementById("button-fritidshus").className = "pure-button";
//         
//     } else if (type === "fritidshus") {
//         
//         document.getElementById("button-lejlighed").className = "pure-button";
//         document.getElementById("button-hus").className = "pure-button";        
//     }   
        
    // ...
            
    obj = makeRequestObject(forecasting, m, type);

    dataDraw(obj);
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


// ...

function aiReset(c) {
    
    if (c === "ai") {
        
        document.getElementById("radio-ai").checked = true;
        
        forecasting = true;
        
        toggleDisplay("history", "ai")
        
    } else {

        document.getElementById("radio-history").checked = true;
        
        forecasting = false; 
        
        toggleDisplay("ai", "history")
    }
}


// ...

function init() {
    
    // opdate locations
    
    //setAction();
    
    $.ajax({"method": "GET", "url": host + "omraader-bm.csv", "dataType": "text", "cache": true}).then((r) => {
                    
        locations = r.split("\n").filter(c => c !== "");
        
        postnumre = locations.filter(c => (c).match(regex));
        
        kommuner = _.difference(locations, postnumre);
        
        optionElements("zip", postnumre);
        
        // example diagram
        
        omraade = ["Hele landet"];
        
        statistics("udbud-pris", "lejlighed");

        
//         clearAction();
    });
}


// run once

init();


























































