import React, { useState, FormEvent } from "react";

const WMSClient: React.FC = () => {
  const [id, setId] = useState<string>("");
  const [session, setSession] = useState<string>("");
  const [bbox, setBbox] = useState<string>(
    "40.51223862118809,0.06467085164777338,42.88455540408618,3.362181532390217"
  );
  const [time, setTime] = useState<string>("1987-01-01T00:00:00.000Z");
  const [width, setWidth] = useState<string>("800");
  const [height, setHeight] = useState<string>("600");
  const [crs, setCrs] = useState<string>("EPSG:4326");
  const [format, setFormat] = useState<string>("image/png");
  const [transparent, setTransparent] = useState<string>("true");
  const [styles, setStyles] = useState<string>("");
  const [imageSrc, setImageSrc] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const proxyUrl = "http://localhost:3000/wms";

    const queryString = `id=${id}&session=${session}&service=WMS&version=1.3.0&request=GetMap&layers=input_lulc_extended_types&bbox=${bbox}&time=${time}&width=${width}&height=${height}&crs=${crs}&format=${format}&transparent=${transparent}&styles=${styles}`;

    console.log(`${proxyUrl}?${queryString}`);

    try {
      const response = await fetch(`${proxyUrl}?${queryString}`, {
        headers: {
          "X-Parse-Session-Token": session,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Convert the response to a blob
      const blob = await response.blob();
      setImageSrc(URL.createObjectURL(blob));
      setError(null); // Clear any previous errors
    } catch (err) {
      setError(`Error fetching WMS data: ${err}`);
      setImageSrc(""); // Clear any previous image
    }
  };

  return (
    <div>
      <h1>WMS Client</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="id">WMS ID:</label>
          <input
            type="text"
            id="id"
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="session">Session Token:</label>
          <input
            type="text"
            id="session"
            value={session}
            onChange={(e) => setSession(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="bbox">Bounding Box:</label>
          <input
            type="text"
            id="bbox"
            value={bbox}
            onChange={(e) => setBbox(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="time">Time:</label>
          <input
            type="text"
            id="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="width">Width:</label>
          <input
            type="text"
            id="width"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="height">Height:</label>
          <input
            type="text"
            id="height"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="crs">CRS:</label>
          <input
            type="text"
            id="crs"
            value={crs}
            onChange={(e) => setCrs(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="format">Format:</label>
          <input
            type="text"
            id="format"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="transparent">Transparent:</label>
          <input
            type="text"
            id="transparent"
            value={transparent}
            onChange={(e) => setTransparent(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="styles">Styles:</label>
          <input
            type="text"
            id="styles"
            value={styles}
            onChange={(e) => setStyles(e.target.value)}
          />
        </div>
        <button type="submit">Request WMS</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {imageSrc && (
        <img
          src={imageSrc}
          alt="WMS Map"
          style={{ width: "800px", height: "600px" }}
        />
      )}
    </div>
  );
};

export default WMSClient;
