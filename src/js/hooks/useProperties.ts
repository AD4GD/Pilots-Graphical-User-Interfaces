import { useMemo } from "react";

export const useProperties = (items: any[]) => {
  return useMemo(() => {
    const flatProperties = items.map((item: any[]) => {
      const { valueTypes } = item[0];
      const key = valueTypes[0].name;
      const label = valueTypes[0].name;
      return { key, label };
    });

    const predictionProps = flatProperties.filter((prop) =>
      /prediction/i.test(prop.label)
    );
    const mainProps = flatProperties.filter(
      (prop) => !/prediction/i.test(prop.label)
    );

    const result: { [group: string]: { key: string; label: string }[] } = {
      Main: mainProps,
    };

    const used = new Set<string>();
    predictionProps.forEach((predictionProp) => {
      if (used.has(predictionProp.key)) return;

      const keywords = predictionProp.label.toLowerCase().split(/[\s\-_/]+/);
      const relatedMain = mainProps.find((mainProp) => {
        const mainKeywords = mainProp.label.toLowerCase().split(/[\s\-_/]+/);
        return keywords.some((kw) => mainKeywords.includes(kw));
      });

      const groupMembers = predictionProps.filter((p) => {
        if (used.has(p.key)) return false;
        const pKeywords = p.label.toLowerCase().split(/[\s\-_/]+/);
        return keywords.some((kw) => pKeywords.includes(kw));
      });

      groupMembers.forEach((p) => used.add(p.key));
      if (relatedMain && groupMembers.length > 0) {
        result[relatedMain.label] = [relatedMain, ...groupMembers];
      }
    });

    return result;
  }, [items]);
};
