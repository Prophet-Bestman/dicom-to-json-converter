import fs from "fs";
import dicomParser from "dicom-parser";
import { TAG_DICT } from "./tagDictionary.js";

function readDicomSeries(folderPath) {
  const fileNames = fs.readdirSync(folderPath);
  const series = [];

  fileNames.forEach((fileName) => {
    const filePath = `${folderPath}/${fileName}`;
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

      // Usage
      var formattedInstance = formatNestedObjects(instance);

      series.push(formattedInstance);
    } catch (error) {
      console.error(`Error parsing DICOM file ${fileName}: ${error.message}`);
    }
  });

  return series;
}

const dicomSeries = readDicomSeries("public/series-000001");

const jsonResult = JSON.stringify(dicomSeries, null, 2);

console.log(jsonResult);

// ========  FORMER CODE ==========

// Extract series information
// const seriesInstanceUID = dataSet.string("x0020000e");
// const seriesNumber = dataSet.intString("x00200011");
// const modality = dataSet.string("x00080060");
// const sliceThickness = dataSet.floatString("x00180050");
// const pixelSpacingString = dataSet.string("x00280030");
// const imageOrientationPatientString = dataSet.string("x00200037");
// const imagePositionPatientString = dataSet.string("x00200032");

// let currentSeries = series.find(
//   (s) => s.SeriesInstanceUID === seriesInstanceUID
// );

// if (!currentSeries) {
//   currentSeries = {
//     seriesInstanceUID,
//     SeriesNumber: seriesNumber,
//     Modality: modality,
//     SliceThickness: sliceThickness,
//     instances: [],
//   };
//   series.push(currentSeries);
// }

// // Extract instance metadata
// const instanceNumber = dataSet.intString("x00200013");
// const metadata = {
//   Columns: dataSet.intString("x00280011"),
//   Rows: dataSet.intString("x00280010"),
//   InstanceNumber: instanceNumber,
//   SOPClassUID: dataSet.string("x00080016"),
//   PhotometricInterpretation: dataSet.string("x00280004"),
//   BitsAllocated: dataSet.intString("x00280100"),
//   BitsStored: dataSet.intString("x00280101"),
//   PixelRepresentation: dataSet.intString("x00280103"),
//   SamplesPerPixel: dataSet.intString("x00280002"),
//   PixelSpacing: pixelSpacingString
//     ? pixelSpacingString.split("\\").map(parseFloat)
//     : [],
//   ImageOrientationPatient: imageOrientationPatientString
//     ? imageOrientationPatientString.split("\\").map(parseFloat)
//     : [],
//   ImagePositionPatient: imagePositionPatientString
//     ? imagePositionPatientString.split("\\").map(parseFloat)
//     : [],
//   HighBit: dataSet.intString("x00280102"),

//   FrameOfReferenceUID: dataSet.string("x00200052"),
//   ImageType: dataSet.string("x00080008").split("\\"),
//   SOPInstanceUID: dataSet.string("x00080018"),
//   SeriesInstanceUID: seriesInstanceUID,
//   StudyInstanceUID: dataSet.string("x0020000d"),
//   WindowCenter: dataSet.intString("x00281050"),
//   WindowWidth: dataSet.intString("x00281051"),
//   SeriesDate: dataSet.string("x00080021"),
// };
