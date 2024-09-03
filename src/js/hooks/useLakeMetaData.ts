import Parse from "parse";
import React from "react";
import { useParseQuery } from "parse-hooks";
import { AD4GD_LakeImages, AD4GD_LakeMetaData } from "../types";

export const useLakeMetaData = () => {
  const query = React.useMemo(
    () => new Parse.Query<AD4GD_LakeMetaData>(AD4GD_LakeMetaData),
    []
  );
  const result = useParseQuery(query);
  return result;
};

export const useLakeImages = (lakeId?: string) => {
  const innerLake = lakeId || "____empty_____";
  console.log({ innerLake, lakeId });
  const query = React.useMemo(() => {
    const lake = AD4GD_LakeMetaData.createWithoutData(innerLake);
    const imageQuery = new Parse.Query(AD4GD_LakeImages).equalTo("lake", lake);
    return imageQuery;
  }, [innerLake]);

  const result = useParseQuery(query);
  return result;
};
