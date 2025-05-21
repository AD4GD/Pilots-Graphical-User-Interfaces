import { useMemo } from "react";

export const useProperties = (items: any[]) => {
  return useMemo(() => {
    // Flatten properties from items
    const flatProperties = items.map((item: any[]) => {
      const { valueTypes } = item[0];
      const key = valueTypes[0].name;
      const label = valueTypes[0].name;
      return { key, label };
    });

    // Separate prediction vs main props
    const predictionProps = flatProperties.filter((prop) =>
      /prediction/i.test(prop.label)
    );
    const mainProps = flatProperties.filter(
      (prop) => !/prediction/i.test(prop.label)
    );

    const result: { [group: string]: { key: string; label: string }[] } = {
      Main: mainProps,
    };

    // To keep track of used prediction keys in groups
    const used = new Set<string>();

    // Keep track of main sensors that have predictions
    const mainWithPredictionSet = new Set<string>();

    predictionProps.forEach((predictionProp) => {
      if (used.has(predictionProp.key)) return;

      const keywords = predictionProp.label.toLowerCase().split(/[\s\-_/]+/);
      const relatedMain = mainProps.find((mainProp) => {
        const mainKeywords = mainProp.label.toLowerCase().split(/[\s\-_/]+/);
        return keywords.some((kw) => mainKeywords.includes(kw));
      });

      // Find all prediction props related by keywords
      const groupMembers = predictionProps.filter((p) => {
        if (used.has(p.key)) return false;
        const pKeywords = p.label.toLowerCase().split(/[\s\-_/]+/);
        return keywords.some((kw) => pKeywords.includes(kw));
      });

      groupMembers.forEach((p) => used.add(p.key));
      if (relatedMain && groupMembers.length > 0) {
        // Add the main sensor with its prediction sensors as a group
        result[relatedMain.label] = [relatedMain, ...groupMembers];
        mainWithPredictionSet.add(relatedMain.label); // mark this main as having prediction data
      }
    });

    // Create an array of main sensors which have prediction data available
    const MainWithPrediction = mainProps.filter((main) =>
      mainWithPredictionSet.has(main.label)
    );

    console.log("Properties", { ...result, MainWithPrediction });

    return { ...result, MainWithPrediction };
  }, [items]);
};
