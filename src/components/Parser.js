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
    console.log("filetype = " + file.type);
    let reader = new FileReader();
    if (file.type === "text/plain"){
      console.log("nordea");
      reader.onload = () => this.storeResults(reader.result);
      reader.readAsText(file);
    }
    else {
      console.log("OP");
      reader.onload = () => this.storeOP(reader.result);
      reader.readAsText(file, 'windows-1252');
    }
    //
  }

  storeOP(result) {
    const data = result.replace(/;/g, "\n")
    var result = [];
    var cells = data.split("\n");
    cells.forEach(element => {
      var strings = element.split(/\t/);
      strings.forEach(el => {
        result.push(el);
      })
    });

    const arrayFilter = result.filter(el => {
      // eslint-disable-next-line eqeqeq
      return el != null && el != "" && el != " ";
    });
    const accountNumber = arrayFilter[11];
    console.log(accountNumber);
    var shift = arrayFilter.splice(0, 25);
    console.log(arrayFilter);

    var transactionArray = [];

    while (/^\s*(3[01]|[12][0-9]|0?[1-9])\.(1[012]|0?[1-9])\.((?:19|20)\d{2})\s*$/g.test(arrayFilter[0])) {
      console.log(/^\s*(3[01]|[12][0-9]|0?[1-9])\.(1[012]|0?[1-9])\.((?:19|20)\d{2})\s*$/g.test(arrayFilter[0])); //DD.MM.YYYY regex

      // If account number is missing, BIC will be missing too. Add empty elements to array.
      if (arrayFilter[6] == '"Viesti:"' || arrayFilter[6] == '""') {
        arrayFilter.splice(6, 0, "");
        arrayFilter.splice(8, 0, "");
      }

      // Stitch message together
      var messageString = arrayFilter[7] + " " + arrayFilter[9] + " " + arrayFilter[10] + " " + arrayFilter[11] + " " + arrayFilter[12]; 
      messageString = messageString.replace(/\s+/g,' ').trim();   // remove extra whitespace from message
      messageString = messageString.replace(/"/g,"").trim();      // remove double quotes from message

      var transactionObject = { "Kirjauspäivä":arrayFilter[0], "Arvopäivä":arrayFilter[4], "Maksupäivä":"", "Määrä":arrayFilter[1], "Saaja/Maksaja":arrayFilter[5].replace(/\s+/g,' ').trim(), 
      "Tilinumero":arrayFilter[6], "BIC":arrayFilter[8], "Tapahtuma":arrayFilter[2].replace(/"/g,"").trim(), // includes reference number, unsure which one so kept here
      "Viite":"", "Maksajan viite:":"", "Viesti":messageString, "Kortinnumero":"", "Kuitti":"" }
  
      transactionArray.push(transactionObject);

      //console.log(arrayFilter)
      shift = arrayFilter.splice(0, 13);
      //console.log(arrayFilter)
    }
    
    // { Tili: [{ [accountNumber]: out }] }



    console.log(transactionArray);

    /*
    ALL TRANSACTIONS ARE THE SAME SIZE, INCLUDE EMPTY CELLS AND MANUALLY CREATE OBJECT FROM ARRAYS

    new array
    DO {
      // Message split to multiple arrays in OP
      var messageString = arrayFilter[7] + " " + arrayFilter[9] + " " + arrayFilter[10] + " " + arrayFilter[11] + " " + arrayFilter[12]; // these are arrays, cannot slice like strings
      messageString = messageString.replace(/"/g,""); // remove all double quotes
      messageString = messageString.trim();           // trim whitespaces
      messageString = '"' + messageString + '"';      // add outer quotes back

      append object: { "Kirjauspäivä":arrayFilter[0], "Arvopäivä":arrayFilter[4], "Maksupäivä":"", "Määrä":arrayFilter[1], "Saaja/Maksaja":arrayFilter[5], "Tilinumero":arrayFilter[6], 
      "BIC":arrayFilter[8], "Tapahtuma":arrayFilter[2], // includes reference number, unsure which one so kept here
      "Viite":"", "Maksajan viite:":"", "Viesti":messageString, "Kortinnumero":"", "Kuitti":""  } 
    }
    WHILE (regex == true)

    NO NEED FOR THIS!

    new array
    DO {
      append inner array
      append object: { "Kirjauspäivä":arrayFilter[0], "Arvopäivä":arrayFilter[4], "Maksupäivä":"", "Määrä":arrayFilter[1], "Saaja/Maksaja":arrayFilter[5], "Tilinumero":arrayFilter[6]  } 
      var i = 8;
      if arrayFilter[7] == '"Viesti"' {
        all arrays after viesti as singular object value until BIC or date is reached
        var messageArray = [];
        while (arrayFilter[i] != BIC || arrayFilter[i] != regex) {
          messageArray.push(arrayFilter[i]);
          i++;
        }
        append object: { "Viesti":messageArray.join(" ") }
      }
      while (arrayFilter[i] != regex) {
        if (arrayFilter[i] == BIC) {
          append object: { "BIC":arrayFilter[i] }
        }
        i++
      }
    arrayFilter.splice(0, [i])
    }
    WHILE (regex == true)
    new object, accountnumber: [ARRAY]


    /*
    myObj = { "name":"John", "age":30, "car":null };
    x = myObj.name;
    */
    //console.log(mergeArray);

    /*
      Create following object:
      0: Kirjauspäivä   -> 0:
      1: Arvopäivä      -> 4:
      2: Maksupäivä     -> -
      3: Määrä          -> 1:
      4: Saaja/Maksaja  -> 5:
      5: Tilinumero     -> 6: 
      6: BIC            -> 7:
      7: Tapahtuma      -> 2[0]
      8: Viite          -> 2[1]
      9: Maksajan viite -> -
      10: Viesti        -> 5???
      11: Kortinnumero  -> 5???
      12: Kuitti        -> -
    

    
    //var mergeArray = arrayFilter[0];
    var i = 0
    do {
      console.log(i);
      console.log(arrayFilter[i]);
      i++;
      
    }
    while (i < 60);
*/
  }

  async storeResults(result) {
    //data = result;
    //console.log(data);

    // GENERATE HASH FROM FILE CONTENT
    // THIS PART IS GOING TO REPEAT, SEPARATE FROM THIS FUNCTION
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
          accept=".txt,.csv"
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
// OP formatting -> Message and reference as own elements, make array of arrays because multi-line messages because OP formatting, every item has several empty rows, use this.
// check file suitability
