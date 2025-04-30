import React from "react";
import {
  Button,
  Card,
  Col,
  ConfigProvider,
  Flex,
  Input,
  Row,
  Typography,
} from "antd";
import { WidgetStatic } from "@opendash/plugin-monitoring";
import { useDataService } from "@opendash/plugin-timeseries";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { genInputSmallStyle } from "antd/es/input/style";
import { useNavigate } from "@opendash/router";

const { Search } = Input;

const { Title, Text } = Typography;

const Information: React.FC = ({ ...data }) => {
  const navigate = useNavigate();
  const DataService = useDataService();
  console.log("data", data);

  DataService.fetchDimensionValuesMultiItem([], {
    historyType: "relative",
    unit: "year",
    value: 2,
  }).then((result) => {
    //Array of Data Points
    console.log("transformed data", result);
    // const transformedData = transformData(result);
    // setData(transformedData);
  });

  return (
    <>
      <Row style={{ width: "100%", height: "80px" }}>
        <WidgetStatic
          style={{ width: "100%", height: "100%" }}
          type="header-widget"
          config={""}
        ></WidgetStatic>
      </Row>

      <Row style={{ width: "100%", height: "calc(90vh - 80px)" }}>
        <Col
          span={6}
          style={{
            backgroundColor: "white",
            height: "100%",
            paddingLeft: "1%",
          }}
        >
          <Flex vertical justify="flex-start" align="flex-start">
            <Button
              icon={<ArrowLeftOutlined />}
              iconPosition="start"
              type="link"
              style={{ color: "#42A456", padding: 0 }}
              onClick={() => {
                navigate("/home");
              }}
            >
              Zurück zur Übersicht
            </Button>
            <Title
              level={1}
              style={{
                fontWeight: "bold",
                width: "100%",
                letterSpacing: "0.25rem",
              }}
            >
              Information
            </Title>
            <Button type="link" style={{ color: "#42A456", padding: 0 }}>
              Impressum
            </Button>
            <Button type="link" style={{ color: "#42A456", padding: 0 }}>
              Datenschutz
            </Button>
          </Flex>
        </Col>
        <Col span={18} style={{ padding: "1%" }}>
          <Flex vertical justify="center" align="center" gap="small">
            <Card
              title="Information über das Projekt"
              bordered={false}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "0.5rem",
              }}
            >
              <p>
                AD4GD ist ein Projekt, dass sich dem Thema “Green Deal
                Dataspaces” in drei Pilot-Fällen nähert. Ein Pilot beschäftigt
                sich mit dem Thema “Biodiversität” insbesondere in der Umgebung
                um Barcelona. Ein weiterer Pilot beschäftigt sich mit dem Thema
                “Luftqualität” insbesondere mit der Fragestellung, inwiefern
                Sensorik die Messungen unterstützen können. Der Pilot zum Thema
                “Wasser” beschäftigt sich mit Berlin's kleinen Seen und wie mehr
                Informationen zu diesen gebündelt bereitgestellt werden können.
                Im Rahmen dieses Piloten wurde das vorliegende Tool generiert.
              </p>
              <Button type="link" style={{ color: "#42A456", padding: 0 }}>
                AD4GD Projekt Webseite
              </Button>
            </Card>

            <Card
              title="Wie wurden die vorliegende Daten erhoben?"
              bordered={false}
              style={{ width: "100%", height: "100%", borderRadius: "0.5rem" }}
            >
              <p>
                Beschreibung wo die verschiedenen Daten herkommen, wie viele
                Messstellen es gibt und wer für die verschiedenen Daten
                zuständig ist.
              </p>
              <Button type="link" style={{ color: "#42A456", padding: 0 }}>
                Wasserportal Berlin
              </Button>
            </Card>

            <Card
              title="Haftungausschuss"
              bordered={false}
              style={{ width: "100%", height: "100%", borderRadius: "0.5rem" }}
            >
              <p>tbd</p>
            </Card>
          </Flex>
        </Col>
      </Row>
    </>
  );
};

export default Information;
