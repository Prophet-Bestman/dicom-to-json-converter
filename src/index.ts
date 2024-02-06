import fs from "fs";
import dicomParser from "dicom-parser";
import { TAG_DICT } from "./tagDictionary.js";

function readDicomSeries(filePath) {
  const fileContent = fs.readFileSync(filePath);

  function getTag(tag) {
    var group = tag.substring(1, 5);
    var element = tag.substring(5, 9);
    var tagIndex = ("(" + group + "," + element + ")").toUpperCase();
    var attr = TAG_DICT[tagIndex];
    return attr;
  }

  try {
    // Parse DICOM file
    const dataSet = dicomParser.parseDicom(fileContent);

    var options = {
      omitPrivateAttibutes: false,
      maxElementLength: 128,
    };

    var instance = dicomParser.explicitDataSetToJS(dataSet, options);

    function formatNestedObjects(instance) {
      var formattedInstance = {};

      function formatItem(item) {
        var itemFormatted = {};
        for (var itemTag in item) {
          if (item.hasOwnProperty(itemTag)) {
            var itemTagAttr = getTag(itemTag);
            if (itemTagAttr) {
              var itemTagValue = item[itemTag];
              if (itemTagAttr.vr == "SQ") {
                // Recursively format nested sequences
                itemTagValue = itemTagValue.map(formatItem);
              }
              itemFormatted[itemTagAttr.name] = itemTagValue;
            }
          }
        }
        return itemFormatted;
      }

      for (var tag in instance) {
        if (instance.hasOwnProperty(tag)) {
          var tagAttr = getTag(tag);
          if (tagAttr) {
            var tagValue = instance[tag];

            if (typeof tagValue === "string" && tagValue.includes("\\")) {
              var tagArray = tagValue.split("\\");

              // @ts-ignore
              tagArray = tagArray.map(String);

              tagValue = tagArray;
            }

            if (tagAttr.vr == "SQ") {
              // Recursively format nested sequences
              tagValue = tagValue.map(formatItem);
            }
            formattedInstance[tagAttr.name] = tagValue;
          }
        }
      }

      return formattedInstance;
    }

    var formattedInstance = formatNestedObjects(instance);

    return formattedInstance;
  } catch (error) {
    console.error(`Error parsing DICOM file ${filePath}: ${error.message}`);
  }
}

const dicomSeries = readDicomSeries("public/series-000001/image-000030.dcm");

const jsonResult = JSON.stringify(dicomSeries, null, 2);

console.log(jsonResult);
