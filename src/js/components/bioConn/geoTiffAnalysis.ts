import * as GeoTIFF from "geotiff";
import geoblaze from "geoblaze";
/**
 * Utility to analyze and compare GeoTIFF properties, specifically looking for missing geospatial metadata
 */
export interface GeoTiffAnalysis {
  metadata: any;
  geoKeys: any;
  imageWidth: number;
  imageHeight: number;
  resolution: any;
  bbox: number[] | null;
  samples: number;
  bitsPerSample: any;
  compressionType: any;
  modelType: any;
  projectionType: any;
  geographicType: any;
  hasGeospatialReferencing: boolean;
  missingProperties: string[];
}

/**
 * Analyzes a GeoTIFF ArrayBuffer to extract all metadata and identify missing properties
 */
export const analyzeGeoTiff = async (
  arrayBuffer: ArrayBuffer
): Promise<GeoTiffAnalysis> => {
  try {
    const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
    const image = await tiff.getImage();

    // Get basic TIFF data
    const metadata = image.getFileDirectory();
    const geoKeys = image.getGeoKeys ? image.getGeoKeys() : null;
    const width = image.getWidth();
    const height = image.getHeight();
    const samples = image.getSamplesPerPixel();
    const bitsPerSample = metadata.BitsPerSample;
    const compressionType = metadata.Compression;

    // Get resolution and bounding box (may fail for non-geo TIFFs)
    let resolution = null;
    let bbox = null;

    try {
      resolution = image.getResolution();
    } catch (e) {
      console.warn("Could not get resolution:", e);
    }

    try {
      bbox = image.getBoundingBox();
    } catch (e) {
      console.warn("Could not get bounding box:", e);
    }

    const modelType = geoKeys?.GTModelTypeGeoKey;
    const projectionType = geoKeys?.ProjectedCSTypeGeoKey;
    const geographicType = geoKeys?.GeographicTypeGeoKey;

    // Check for missing critical geospatial properties
    const missingProperties: string[] = [];
    let hasGeospatialReferencing = true;

    if (!geographicType) {
      missingProperties.push("GeographicTypeGeoKey");
      hasGeospatialReferencing = false;
    }
    if (!modelType) {
      missingProperties.push("GTModelTypeGeoKey");
    }
    if (!bbox) {
      missingProperties.push("BoundingBox");
      hasGeospatialReferencing = false;
    }
    if (!geoKeys) {
      missingProperties.push("GeoKeys");
      hasGeospatialReferencing = false;
    }

    return {
      metadata,
      geoKeys,
      imageWidth: width,
      imageHeight: height,
      resolution,
      bbox,
      samples,
      bitsPerSample,
      compressionType,
      modelType,
      projectionType,
      geographicType,
      hasGeospatialReferencing,
      missingProperties,
    };
  } catch (error) {
    throw new Error(`Failed to analyze GeoTIFF: ${error.message}`);
  }
};

/**
 * Attempts to fix a GeoTIFF by adding missing geospatial metadata
 */
export const fixGeoTiffMetadata = async (
  originalArrayBuffer: ArrayBuffer,
  referenceAnalysis: GeoTiffAnalysis
): Promise<ArrayBuffer> => {
  try {
    // This is a complex operation that would require rewriting the TIFF file
    // For now, we'll log what needs to be fixed and return the original
    console.warn(
      "GeoTIFF fixing not implemented yet. Missing properties:",
      referenceAnalysis.missingProperties
    );

    // In a full implementation, you would:
    // 1. Parse the original TIFF structure
    // 2. Add missing GeoKeys (like GeographicTypeGeoKey: 32631)
    // 3. Reconstruct the TIFF with proper metadata
    // 4. Return the fixed ArrayBuffer

    return originalArrayBuffer;
  } catch (error) {
    throw new Error(`Failed to fix GeoTIFF metadata: ${error.message}`);
  }
};

/**
 * Converts base64 data to ArrayBuffer (same as in compareScenario)
 */
export const base64ToArrayBuffer = (base64Data: string): ArrayBuffer => {
  const binaryString = atob(base64Data);
  const arrayBuffer = new ArrayBuffer(binaryString.length);
  const uintArray = new Uint8Array(arrayBuffer);

  for (let i = 0; i < binaryString.length; i++) {
    uintArray[i] = binaryString.charCodeAt(i);
  }

  return arrayBuffer;
};

/**
 * Compares two GeoTIFF analyses and highlights differences
 */
export const compareGeoTiffAnalyses = (
  analysis1: GeoTiffAnalysis,
  analysis2: GeoTiffAnalysis
): { differences: string[]; criticalIssues: string[] } => {
  const differences: string[] = [];
  const criticalIssues: string[] = [];

  // Compare critical geospatial properties
  if (analysis1.geographicType !== analysis2.geographicType) {
    const diff = `GeographicType: ${analysis1.geographicType} vs ${analysis2.geographicType}`;
    differences.push(diff);
    if (!analysis1.geographicType || !analysis2.geographicType) {
      criticalIssues.push(`Missing GeographicType in one file: ${diff}`);
    }
  }

  if (analysis1.modelType !== analysis2.modelType) {
    const diff = `ModelType: ${analysis1.modelType} vs ${analysis2.modelType}`;
    differences.push(diff);
  }

  if (analysis1.projectionType !== analysis2.projectionType) {
    const diff = `ProjectionType: ${analysis1.projectionType} vs ${analysis2.projectionType}`;
    differences.push(diff);
  }

  // Compare dimensions
  if (
    analysis1.imageWidth !== analysis2.imageWidth ||
    analysis1.imageHeight !== analysis2.imageHeight
  ) {
    differences.push(
      `Dimensions: ${analysis1.imageWidth}x${analysis1.imageHeight} vs ${analysis2.imageWidth}x${analysis2.imageHeight}`
    );
  }

  // Compare bounding boxes
  if (JSON.stringify(analysis1.bbox) !== JSON.stringify(analysis2.bbox)) {
    differences.push(
      `BoundingBox: ${JSON.stringify(analysis1.bbox)} vs ${JSON.stringify(
        analysis2.bbox
      )}`
    );
    if (!analysis1.bbox || !analysis2.bbox) {
      criticalIssues.push("Missing bounding box in one file");
    }
  }

  // Check for missing properties that could cause geoblaze issues
  const allMissingProps = [
    ...new Set([
      ...analysis1.missingProperties,
      ...analysis2.missingProperties,
    ]),
  ];
  if (allMissingProps.length > 0) {
    criticalIssues.push(
      `Missing properties that may cause geoblaze issues: ${allMissingProps.join(
        ", "
      )}`
    );
  }

  return { differences, criticalIssues };
};

/**
 * Creates a georaster with fallback metadata when geoblaze fails
 */
export const createFallbackGeoraster = async (
  arrayBuffer: ArrayBuffer,
  referenceAnalysis?: GeoTiffAnalysis
): Promise<any> => {
  try {
    const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
    const image = await tiff.getImage();

    // Read raster data
    const rasters = await image.readRasters();
    const width = image.getWidth();
    const height = image.getHeight();

    // Use reference analysis for missing metadata if available
    let bbox = null;
    try {
      bbox = image.getBoundingBox();
    } catch (e) {
      if (referenceAnalysis?.bbox) {
        console.warn("Using reference bounding box as fallback");
        bbox = referenceAnalysis.bbox;
      }
    }

    if (!bbox) {
      throw new Error("No bounding box available - cannot create georaster");
    }

    // Create a simplified georaster object with fallback metadata
    const georaster = {
      values: rasters,
      width: width,
      height: height,
      xmin: bbox[0],
      ymin: bbox[1],
      xmax: bbox[2],
      ymax: bbox[3],
      pixelWidth: (bbox[2] - bbox[0]) / width,
      pixelHeight: (bbox[3] - bbox[1]) / height,
      projection: referenceAnalysis?.geographicType || 32631, // Fallback to EPSG:32631 (UTM Zone 31N)
      noDataValue: null,
      // Add missing geospatial metadata as fallback
      _metadata: {
        geographicType: referenceAnalysis?.geographicType || 32631,
        modelType: referenceAnalysis?.modelType || 1,
        projectionType: referenceAnalysis?.projectionType,
        source: "fallback_creation",
      },
    };

    return georaster;
  } catch (error) {
    throw new Error(`Failed to create fallback georaster: ${error.message}`);
  }
};
