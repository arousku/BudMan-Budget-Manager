import React, { Component } from "react";

class Parser extends Component {
  constructor(props) {
    super(props);
    this.handleChangeFile = this.handleChangeFile.bind(this);
    this.storeResults = this.storeResults.bind(this);
    this.state = {
      fileName: ""
    }
  }

  handleChangeFile(e) {
    const file = e.target.files[0]
    let reader = new FileReader();
    reader.onload = () => this.storeResults(reader.result);
    reader.readAsText(file);
    this.setState({
      fileName: file.name
    });
  }

  storeResults(result) {
    //data = result;
    //console.log(data);

    // GENERATE HASH FROM FILE CONTENT
    var Hashes = require('jshashes')
    var MD5 = new Hashes.MD5().hex(result);
    console.log("MD5: " + MD5);

    // NORDEA FILE -> JSON
    var fileName = this.state.fileName;
    //console.log("filename in storeResults: " + fileName);
    var cells = result.split('\n\r\n').map(function (el) { return el.split(/\t/); }); // split data into arrays and further into elements
    //console.log(cells);
    var account = cells.shift();
    //console.log(account);
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
    var jsonContent;
    console.log(jsonContent);

    var app = window.require('electron').remote;
    const fs = app.require('fs');

    try {
      // CALL HASH STORING FUNCTION
      this.storeHash(MD5);

      // IF JSON EXISTS
      if (fs.existsSync("./output.json")) {
        jsonContent = JSON.stringify({ [accountNumber]: {[fileName]: out} });
        //console.log(jsonContent);
        var contentParsed = JSON.parse(jsonContent);
        console.log(contentParsed);
        // IF STOREHASH RETURNS TRUE
          // CONTINUE
          // LOG 
        //ELSE
        // MERGE DATA TO JSON OUTPUT
        console.log("file exists!");
        
        fs.readFile("./output.json", "utf8", function readFileCallback(err, existingData){
          if (err){
            console.log(err);
          } else {
            var obj = JSON.parse(existingData);
            obj.Tili.push(contentParsed);
            console.log(obj);
            fs.writeFile("output.json", JSON.stringify(obj), 'utf8', function (err) {
              if (err) {
                console.log("An error occured while writing JSON Object to File.");
                return console.log(err);
              }
              console.log("JSON file has been saved.");
            }); 
          }
        }
        );



        /*
        fs.appendFile("output.json", jsonContent, 'utf8', function (err) {
          if (err) {
            console.log("An error occured while writing JSON Object to File.");
            return console.log(err);
          }
          console.log("JSON file has been saved.");
        });
        */ 


      }
      // IF JSON DOES NOT EXIST
      // SAVE JSON
      else {

        jsonContent = JSON.stringify({ Tili: [ {[accountNumber]: {[fileName]: out} }]});
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

  storeHash(checkSum){
    // IF CHECKSUM FILE EXISTS, LOOP ARRAY 
      // IF ARRAY[i] == CHECKSUM
        // RETURN TRUE
      // ELSE
        // APPEND
        // RETURN FALSE
    // IF CHECKSUM FILE DOESN'T EXIST, CREATE IT
      // APPEND
      // RETURN FALSE
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
// Check hashdata instead of filename
// OP formatting
// check file suitability