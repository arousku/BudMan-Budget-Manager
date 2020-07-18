import React, { Component } from "react";
var app = window.require("electron").remote;
const fs = app.require("fs");

class Parser extends Component {
  constructor(props) {
    super(props);
    this.handleChangeFile = this.handleChangeFile.bind(this);
    this.storeResults = this.storeResults.bind(this);
    this.state = {
      fileName: "",
    };
  }

  handleChangeFile(e) {
    const file = e.target.files[0];
    let reader = new FileReader();
    reader.onload = () => this.storeResults(reader.result);
    reader.readAsText(file);
    this.setState({
      fileName: file.name,
    });
  }

  async storeResults(result) {
    //data = result;
    //console.log(data);

    // GENERATE HASH FROM FILE CONTENT
    var Hashes = require("jshashes");
    var MD5 = new Hashes.MD5().hex(result);
    console.log("MD5: " + MD5);

    // NORDEA FILE -> JSON
    //var fileName = this.state.fileName;
    //console.log("filename in storeResults: " + fileName);
    var cells = result.split("\n\r\n").map(function (el) {
      return el.split(/\t/);
    }); // split data into arrays and further into elements
    //console.log(cells);
    var account = cells.shift();
    //console.log(account);
    var accountNumber = account[1];
    var headings = cells.shift();
    //console.log(headings);
    var out = cells.map(function (el) {
      var obj = {};
      for (var i = 0, l = el.length - 1; i < l; i++) {
        // el.length-1 to remove last empty element. Ghetto solution, i know
        obj[headings[i]] = isNaN(Number(el[i])) ? el[i] : +el[i];
      }
      return obj;
    });
    out.pop(); // remove last empty object
    var jsonContent;
    //console.log(jsonContent);

    try {
      var hashBool = await this.storeHash(MD5);
      console.log("hashbool = " + hashBool);
      // CALL HASH STORING FUNCTION
      if (hashBool) {
        console.log("Hash found, skipping JSON append");
      } else {
        //console.log("this.storeHash(MD5): " + this.storeHash(MD5));
        // IF JSON EXISTS
        if (fs.existsSync("./output.json")) {
          jsonContent = JSON.stringify({ [accountNumber]: out });
          //console.log(jsonContent);
          var contentParsed = JSON.parse(jsonContent);
          console.log(contentParsed);

          console.log("file exists!");

          fs.readFile("./output.json", "utf8", function readFileCallback(
            err,
            existingData
          ) {
            if (err) {
              console.log(err);
            } else {
              var obj = JSON.parse(existingData);
              obj.Tili.push(contentParsed);
              console.log(obj);
              fs.writeFile(
                "output.json",
                JSON.stringify(obj),
                "utf8",
                function (err) {
                  if (err) {
                    console.log(
                      "An error occured while writing JSON Object to File."
                    );
                    return console.log(err);
                  }
                  console.log("JSON file has been saved.");
                }
              );
            }
          });

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
          jsonContent = JSON.stringify({ Tili: [{ [accountNumber]: out }] });
          console.log("file doesn't exist!");
          fs.writeFile("output.json", jsonContent, "utf8", function (err) {
            if (err) {
              console.log(
                "An error occured while writing JSON Object to File."
              );
              return console.log(err);
            }
            console.log("JSON file has been saved.");
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  storeHash(checkSum) {
    var match = false;
    // IF CHECKSUM FILE EXISTS, LOOP ARRAY
    if (fs.existsSync("./checksum.txt")) {
      console.log("checksumfile exists!");
      var existingData = fs.readFileSync("./checksum.txt", "utf8");
      console.log("existing data: " + existingData.toString());
      var obj = existingData.toString();
      //console.log(obj);
      var array = obj.split(",");
      for (var i = 0; i < obj.length; i++) {
        //console.log("array[i]: " + array[i] + " && checkSum: " + checkSum);
        if (array[i] === checkSum) {
          match = true;
          break;
        }
      }
      if (!match) {
        array.push(checkSum);
        fs.writeFile("checksum.txt", array, "utf8", function (err) {
          if (err) {
            console.log(
              "An error occured while pushing array to checksum file."
            );
            return console.log(err);
          }
          console.log("TXT file has been saved.");
        });
      }
    } else {
      // IF CHECKSUM FILE DOESN'T EXIST, CREATE IT
      fs.writeFile("checksum.txt", checkSum, "utf8", function (err) {
        if (err) {
          console.log("An error occured while writing checksum file.");
          return console.log(err);
        }
        console.log("TXT file has been created.");
      });
    }
    return match;
  }

  render() {
    return (
      <div className="parser">
        <input
          type="file"
          id="myFile"
          accept=".txt"
          onChange={(e) => this.handleChangeFile(e)}
        />
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
// Append under existing account number
// OP formatting
// check file suitability
