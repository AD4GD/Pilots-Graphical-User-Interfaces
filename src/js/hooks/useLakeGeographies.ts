import Parse from "parse";
import { useState, useEffect } from "react";

interface Lake {
  id: string;
  label: string;
}

/**
 * Custom hook to fetch all lakes from MIAAS_Geographies
 * @returns Parse query result with all lakes
 */
export const useLakeGeographies = () => {
  const [geographies, setGeographies] = useState<Lake[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchLakes = async () => {
      try {
        setLoading(true);

        // Create a query for the MIAAS_Geographies class
        const Lakes = Parse.Object.extend("MIAAS_Geographies");
        const query = new Parse.Query(Lakes);

        // Fetch all records
        const results = await query.find();

        // Transform Parse objects to plain objects
        const lakeData = results.map((item) => ({
          id: item.id,
          label: item.get("label"),
        }));

        setGeographies(lakeData);
        setError(null);
      } catch (err) {
        console.error("Error fetching lake geographies:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setGeographies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLakes();
  }, []);

  return { geographies, loading, error };
};
