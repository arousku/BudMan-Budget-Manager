import React, { Component } from "react";

class Parser extends Component {
  constructor(props) {
    super(props);
    this.handleChangeFile = this.handleChangeFile.bind(this);
    this.storeResults = this.storeResults.bind(this);
  }

  handleChangeFile(e) {
    const file = e.target.files[0]
    let reader = new FileReader();
    reader.onload = () => this.storeResults(reader.result);
    
    reader.readAsText(file);
  }

  storeResults(result) {
    //data = result;
    //console.log(data);

    // NORDEA FILE -> JSON
    var cells = result.split('\n\r\n').map(function (el) { return el.split(/\t/); }); // split data into arrays and further into elements
    //console.log(cells);
    var account = cells.shift();
    var accountNumber = account[1];
    var headings = cells.shift();
    //console.log(headings);
    var out = cells.map(function (el) {
      var obj = {};
      for (var i = 0, l = el.length-1; i < l; i++) {  // el.length-1 to remove last empty element. Ghetto solution, i know
        obj[headings[i]] = isNaN(Number(el[i])) ? el[i] : +el[i];
        }
      return obj;
    });
    out.pop(); // remove last empty object
    var jsonContent = JSON.stringify({ [accountNumber]: out });
    //console.log(jsonContent);

    var app = window.require('electron').remote;
    const fs = app.require('fs');

    try {
      if (fs.existsSync("./output.json")) {
        // IF JSON EXISTS
        // MERGE DATA TO JSON OUTPUT
        console.log("file exists!");
      }
      else {
        // IF JSON DOES NOT EXIST
        // SAVE JSON
        console.log("file doesn't exist!");
        fs.writeFile("output.json", jsonContent, 'utf8', function (err) {
          if (err) {
            console.log("An error occured while writing JSON Object to File.");
            return console.log(err);
          }
          console.log("JSON file has been saved.");
        }); 
      }
    } catch(err) {
      console.error(err)
    }



  }

  render() {
    return (
      <div className="parser">
          <input type="file" id="myFile" accept=".txt" onChange={e => this.handleChangeFile(e) } />
      </div>
    );
  }
}

export default Parser;

// FILE TO READ
//
//var data = fs.readFileSync('TestFile.txt', 'utf8');
//console.log(data);
/*
// NORDEA FILE -> JSON
//var cells = data.split('\n\r\n').map(function (el) { return el.split(/\t/); }); // split data into arrays and further into elements
//console.log(cells);
var account = cells.shift();
var accountNumber = account[1];
var headings = cells.shift();
//console.log(headings);
var out = cells.map(function (el) {
  var obj = {};
  for (var i = 0, l = el.length-1; i < l; i++) {  // el.length-1 to remove last empty element. Ghetto solution, i know
    obj[headings[i]] = isNaN(Number(el[i])) ? el[i] : +el[i];
    }
  return obj;
});
out.pop(); // remove last empty object
var jsonContent = JSON.stringify({ [accountNumber]: out });
console.log(jsonContent);

// SAVE JSON
var fs = require('fs');
fs.writeFile("output.json", jsonContent, 'utf8', function (err) {
  if (err) {
      console.log("An error occured while writing JSON Object to File.");
      return console.log(err);
  }

  console.log("JSON file has been saved.");
}); 
*/

// TODO 
// npm install merge-json
// OP formatting
// check file suitability