import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { Options } from "../Plugin";

export const TestComponent = observer((props: Partial<Options>) => {
  const [inputValue, setInputValue] = useState<string>("");

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh", // Damit die Komponente vertikal zentriert ist
      }}
    >
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder="Enter your name"
        style={{ marginBottom: "20px" }} // Etwas Platz unter dem Eingabefeld
      />
      <p>Hello, {inputValue || "World"}!</p>
    </div>
  );
});
