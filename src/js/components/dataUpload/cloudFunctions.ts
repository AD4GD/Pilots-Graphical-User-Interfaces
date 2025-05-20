import Parse from "parse";

interface UploadParams {
  source?: string;
  lakeName: string;
  sensorName: string;
  valueType?: string;
  valueUnit: string;
  dataType: string;
  sensorId?: string;
  fileData: File;
  isPublic?: boolean;
}

interface UploadResult {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Uploads sensor data to Parse Server
 * @param params Upload parameters
 * @returns Result of the upload operation
 */
export const importDataToCloud = async (
  params: UploadParams
): Promise<UploadResult> => {
  try {
    // Determine the source based on the dataType
    let source;
    if (params.dataType === "timeseries") {
      source = "ad4gd_lakes";
    } else if (params.dataType === "periodic") {
      source = "ad4gd_lakes_periodic";
    } else {
      source = params.source || "ad4gd_lakes";
    }

    // If data is private, append "_private" to the source
    if (params.isPublic === false) {
      source += "_private";
    }

    // Prepare the file for Parse
    const parseFile = new Parse.File(params.fileData.name, params.fileData);
    await parseFile.save();

    // Call the cloud function
    const result = await Parse.Cloud.run("uploadSensorData", {
      csvFile: parseFile,
      source: source,
      sensorName: params.sensorName,
      valueUnit: params.valueUnit,
      // The sensorId is now properly formatted in the uploadForm component
      // and will be derived on the server using the sensorName
    });

    return {
      success: true,
      message: "Data uploaded successfully!",
      data: result,
    };
  } catch (error) {
    console.error("Error uploading data:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};
