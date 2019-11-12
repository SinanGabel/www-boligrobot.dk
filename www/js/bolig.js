"use strict";


// ...

if (navigator.appName == 'Microsoft Internet Explorer' ||  !!(navigator.userAgent.match(/Trident/) || navigator.userAgent.match(/rv:11/)) || (typeof $.browser !== "undefined" && $.browser.msie == 1)) {
  
    alert("Microsoft Internet Explorer browser - kan ikke bruges, brug venligst en moderne browser - cannot be used, please use a modern browser");
}


// name: Aarhus (geo), value: Århus (udb, bm)

var storage={}, dates={}, omraade=[], omraade2x=[], graphdata=[], locations=[], postnumre=[], kommuner=[];

var forecasting = true, forecasting_switch = true, lang = "da";

const REGEX = /[0-9]/g;

const HOST = "https://storage.googleapis.com/ba7e2966-31de-11e9-819c-b3b1d3be419b/www/v1/";
//const HOST = "https://storage.googleapis.com/ba7e2966-31de-11e9-819c-b3b1d3be419b/test/";

const AHEAD = "*";

const TIME_AHEAD = 6;

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


// toggleDisplay("da", "en") or toggleDisplay("en", "da")

function toggleDisplay(fra, til) {
    
    let block = document.getElementsByName(fra);
    let none = document.getElementsByName(til);
    

    block.forEach(c => {c.className = "display-none";});
    none.forEach(c => {c.className = "display-block";});

}

function changeLanguage(l) {
    
    let da = (l.textContent === "Dansk");
    
    l.textContent = (da) ? "English" : "Dansk" ;
    
    if (da) {
        
        toggleDisplay("en", "da");
        
        lang = "da";
        
    } else {
        
        toggleDisplay("da", "en");
        
        lang = "en";
    }
}


// ...

function toggleCheckBox(id) {
    
    let root = document.getElementById(id);

    if ((id === "precision-box") ? document.getElementById("check-precision").checked : document.getElementById("check-table").checked ) {
        
        root.className = (id === "precision-box") ? "pure-g display-block" : "display-block" ;
        
    } else {
        
        root.className = (id === "precision-box") ? "pure-g display-none" : "display-none" ;
    }
}


// "yyyy-mm-dd" plus x

// datePlus("2018-12-30",2) => "2019-02-28"

// datePlus("2018-12-30",6) => "2019-06-30"

function datePlus(d, x) {

    x = x || 1;
    
    let dt = d.split("-");

    let m = Number(dt[1]) + x - 1; // months m: 0..11
    
    let utcDate = new Date(Date.UTC(Number(dt[0]), m, (((m % 12) === 1) ? 28 : 30)));    
    
    return utcDate.toJSON().substring(0,10);
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
            
            ex[c] = data[c].filter(b => ["03","06","09","12"].includes(b[1].substring(5,7))).map((b) => {return [b[1],b[2]]});
            ex[AHEAD + c] = data[c].map((b) => {return [datePlus(b[1], TIME_AHEAD),b[3]]});   // WARNING 1M currently wrong date therefore this datePlus()
                        
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

// NOTE 1M- first, then actual price, and so on

// TODO possibly make var instead

function omraadeX2(omr, t) {
    
    if (forecasting) {
    
    return _.flatten(omr.map(c => [t + c, c]));
    
    } else {
        
        return omr;
    }
}


// ...

function makeData(obj, select) {
          
    omraadeX2(select, AHEAD).forEach((c,i,ar) => { makeDataX(obj, ar.slice(0, i+1)); });
    
    graphdata = (_.isEmpty(graphdata)) ? [] : _.orderBy(graphdata, ["t"]) ;
        
    return graphdata;
}   


// ...
    
function makeDataX(obj, select) {
    
    let ar = [], diff_dates = [], json = {}, js = {}, k = "", oo = {};
    
    if (! storage[obj.id].hasOwnProperty(select[select.length-1]) || _.isEmpty(storage[obj.id][select[select.length-1]])) { 
                
        message("diagram-message", ("No data for " + select[select.length-1] + ": " + obj.id + "."), 60000);

        console.log("No data for: ", select[select.length-1]); 
        
        select.pop();  // remove last element
        
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
    

// f: forecasting boolean

function makeRequestObject(f, m, type) {
    
    let obj = {};
    
    let title="", y_legend="", filnavn="", id="", 
        bm = true;
        
    // kvartalsdata
        
    bm = (["qpris", "qudbud-pris", "qnedtagne-pris", "salg","salgstid"].includes(m)) ? true : false ; 
    
    // Forecasts or Historic information
    
//     ai = (document.getElementById("data-forecast").className).includes("active");

    
    // postnumre findes kun for kvartalsdata
    
    // WARNING Ikke brug af postnumre pt.
    
    if (false && bm) { 
        
        optionElements("zip", postnumre);
        
    } else {
     
        document.getElementById("zip").textContent = "";
    }
    
    // ...
    
    if (["qpris", "qudbud-pris", "qnedtagne-pris", "udbud-pris", "nedtagne-pris"].includes(m)) {
        
        if (["qpris", "qudbud-pris", "qnedtagne-pris"].includes(m)) {
            
            m = m.substring(1);
        }
            
        // ...    
        
        y_legend = "DKK pr. m2 (price/m2)";
                        
        if (bm && ! f) {
        
            id = type + "-realiseret-" + m; 
            
            filnavn = id + ".csv";
            
            title = "Handelspris, DKK pr. m2 (traded price/m2)";
            
        } else if (! f) {

            id = type + "-annonce-" + m; 

            filnavn = id + ".csv";
            
            title = "Internet " + ((m === "udbud-pris") ? "udbudspris" : "nedtagningspris") + ", DKK pr. m2 (price/m2)";
                        
        } else if (f) {

            id = type + "-prognose-" + m; 

            filnavn = id + ".csv";
            
            title = "Prognose " + m + ", DKK pr. m2 (price/m2)";
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
    
    if (forecasting && ! ["qpris", "qudbud-pris", "qnedtagne-pris", "udbud-pris", "nedtagne-pris"].includes(m)) {
        
        m = "qpris";
    }
        
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


// ...

function aiRadioReset(c) {
    
    setAction();
    
    graphdata = [];  // AHEAD = "*" locations data is not present in the historic data therefore a reset here
    
    if (c === "ai") {
        
        document.getElementById("radio-ai").checked = true;
        
//         document.getElementById("precision-check").className = "display-block"; 
        
        forecasting = true;
        
        toggleDisplay("history", "ai")
        
        
    } else {

        document.getElementById("radio-history").checked = true;
        
//         document.getElementById("precision-check").className = "display-none"; 

        forecasting = false; 
        
        toggleDisplay("ai", "history")
    }
    
    statistics();
}


// ...

function init() {
    
    // opdate locations
    
    //setAction();
    
    $.ajax({"method": "GET", "url": HOST + "omraader-bm.csv", "dataType": "text", "cache": true}).then((r) => {
                            
        locations = r.split("\n").filter(c => c !== "");
        
        postnumre = locations.filter(c => (c).match(REGEX));
        
        kommuner = _.difference(locations, postnumre);
        
        // TODO zip removed for now
        // optionElements("zip", postnumre);
        
        // example diagram
        
        omraade = ["Hele landet"];
        
        statistics("qpris", "lejlighed");

        
//         clearAction();
    }, (err) => {

            console.log(err); 

    });
}


// run once

init();


























































