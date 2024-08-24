import React from "react";
import { Button, ConfigProvider, Result, Row } from "antd";
import { WidgetStatic } from "@opendash/plugin-monitoring";
import { useNavigate } from "@opendash/router";

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <Row style={{ width: "100%", height: "80px" }}>
        <WidgetStatic
          style={{ width: "100%", height: "100%" }}
          type="header-widget"
          config={""}
        ></WidgetStatic>
      </Row>

      <Result
        status="warning"
        title="Die Seite konnte nicht gefunden werden."
        extra={
          <ConfigProvider
            wave={{ disabled: true }}
            theme={{
              token: {
                colorPrimary: "#96F5D0",
                colorTextLightSolid: "fff",
                borderRadius: 6,
                fontSize: 16,
              },
            }}
          >
            <Button
              type="primary"
              size="large"
              onClick={() => {
                navigate("/home");
              }}
            >
              Zurück zur Startseite
            </Button>
          </ConfigProvider>
        }
      />
    </>
  );
};

export default NotFound;
