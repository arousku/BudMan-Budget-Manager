import React, { Component } from "react";
var app = window.require("electron").remote;
const fs = app.require("fs");

class Parser extends Component {
  constructor(props) {
    super(props);
    this.handleChangeFile = this.handleChangeFile.bind(this);
    this.storeNordea = this.storeNordea.bind(this);
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
      reader.onload = () => this.storeNordea(reader.result);
      reader.readAsText(file);
    }
    else {
      console.log("OP");
      reader.onload = () => this.storeOP(reader.result);
      reader.readAsText(file, 'windows-1252');
    }
  }

  storeOP(result) {
    const data = result.replace(/;/g, "\n")
    var resultArray = [];
    var cells = data.split("\n");
    cells.forEach(element => {
      var strings = element.split(/\t/);
      strings.forEach(el => {
        resultArray.push(el);
      })
    });

    const arrayFilter = resultArray.filter(el => {
      // eslint-disable-next-line eqeqeq
      return el != null && el != "" && el != " ";
    });
    var accountNumber = arrayFilter[11];
    console.log(accountNumber);
    accountNumber = accountNumber.replace(/\s+/g,'');   // remove extra whitespace from accountNumber
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
      */

      var transactionObject = { "Kirjauspäivä":arrayFilter[0].replace(/\s/g, ""), "Arvopäivä":arrayFilter[4], "Maksupäivä":"", "Määrä":arrayFilter[1], "Saaja/Maksaja":arrayFilter[5].replace(/\s+/g,' ').trim(), 
      "Tilinumero":arrayFilter[6], "BIC":arrayFilter[8], "Tapahtuma":arrayFilter[2].replace(/"/g,"").trim(), // includes reference number, unsure which one so kept here
      "Viite":"", "Maksajan viite":"", "Viesti":messageString, "Kortinnumero":"", "Kuitti":"" }
  
      transactionArray.push(transactionObject);

      shift = arrayFilter.splice(0, 13);
      //console.log(arrayFilter)
    }

    console.log(transactionArray);
    var accountObject = { [accountNumber]:transactionArray };
    console.log(accountObject);
    this.storeAccount(accountObject, result)
  }

  async storeNordea(result) {
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
        // el.length-1 to remove last empty element
        obj[headings[i]] = isNaN(Number(el[i])) ? el[i] : +el[i];
      }
      return obj;
    });
    out.pop(); // remove last empty object
    var accountObject = { [accountNumber]: out };
    this.storeAccount(accountObject, result)
  }

  async storeAccount(accountObject, result) {
    var jsonContent;
    // GENERATE HASH FROM FILE CONTENT
    var Hashes = require("jshashes");
    var MD5 = new Hashes.MD5().hex(result);
    console.log("MD5: " + MD5);
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
          jsonContent = JSON.stringify(accountObject);

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
              // TODO if account exists
              const numberToCompare = Object.keys(accountObject)[0];
              const obj = JSON.parse(existingData);

              // Go through all account numbers
              let accountKey = 0;
              let accountFound = false;
              console.log("accountLength: " + Object.keys(Object.values(obj.Tili)).length)
              console.log(Object.keys(Object.values(obj.Tili)[accountKey]));
              while (accountKey <= Object.keys(Object.values(obj.Tili)).length - 1) {
                console.log(Object.keys(Object.values(obj.Tili)[accountKey])[0]);
                if (Object.keys(Object.values(obj.Tili)[accountKey])[0] === numberToCompare) {
                  console.log("they are the same!")
                  const contentArray = Object.values(contentParsed)[0];
                  // eslint-disable-next-line no-loop-func
                  contentArray.forEach(item => obj.Tili[accountKey][numberToCompare].push(item));
                  accountFound = true;
                  break;
                } 
                else {
                  console.log("Number doesn't match!")
                  accountKey++;
                }
              }

              if (!accountFound) {
                obj.Tili.push(contentParsed);
              }
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
        }
        // IF JSON DOES NOT EXIST
        // SAVE JSON
        else {
          jsonContent = JSON.stringify({ Tili: [accountObject] });
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

// TODO
// check file suitability
// add two more key - value pairs: Category: "", IsCategorized: false
// check existing categories on upload 
// add category automatically if transactionMessage added to category array: Groceries: ["SALE KORTEPOHJA", "PRISMA SEPPÄLÄ"]. IsCategorized: true
