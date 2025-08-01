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

const bioConninformation: React.FC = ({ ...data }) => {
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
          type="header-bioconn-widget"
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
                navigate("/bioconnect");
              }}
            >
              Back to Connectivity Map
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
              Privacy
            </Button>
          </Flex>
        </Col>
        <Col span={18} style={{ padding: "1%" }}>
          <Flex
            vertical
            justify="flex-start"
            align="center"
            gap="small"
            style={{
              maxHeight: "calc(90vh - 100px)",
              overflowY: "auto",
              paddingRight: "1rem",
            }}
          >
            <Card
              title="Information about the BioConnect Tool"
              bordered={false}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "0.5rem",
              }}
            >
              <p>
                BioConnect tool helps users to estimate the impact on
                terrestrial habitat connectivity (or its fragmentation) due to a
                change in the land use/cover (for example, from crop to forest).
                It gives an overall insight for any interested user but can also
                guide more specialized users such as public managers or
                scientists. To this end, connectivity values are shown together
                with some useful ancillary data which can help in decision
                making, such as: species occurrences, infrastructure data
                (roads, railways, buildings), and other reference data
                (satellite images, orthophotographs, etc).
              </p>
            </Card>

            <Card
              title="How is the connectivity index calculated?"
              bordered={false}
              style={{ width: "100%", height: "100%", borderRadius: "0.5rem" }}
            >
              <p>
                The tool is based on the Terrestrial Connectivity Index (ICT)
                algorithm [Marulli J. and Mallarach J., 2005] and [Serral I. et
                al., 2024], which gives an aggregate index of the connectivity
                from that pixel considering the surrounding ones and the
                friction among land uses/covers. Values range from 0 (poor
                connectivity) to 2.5 (high connectivity) for that specific land
                use/cover. This algorithm is highly machine and time consuming,
                so ML techniques have been applied in this case to fasten the
                calculation. The ICT result given in the BioConnect tool is,
                thus, an approximation and should be considered like this.
                Output results are shown together to ensure trustworthiness and
                enhance decision making.
                <br />
                <br />
                <strong>References:</strong>
                <ul style={{ marginTop: 8, marginBottom: 0 }}>
                  <li>
                    Marulli J. and Mallarach J., 2005.
                    <br />
                    <em>
                      "A GIS methodology for assessing ecological connectivity:
                      application to the Barcelona Metropolitan Area,"
                    </em>
                    <br />
                    Landscape and Urban Planning, vol. 71, no. 2–4, pp. 243-262.
                  </li>
                  <li>
                    Serral I. et al., 2024.
                    <br />
                    <em>
                      "Terrestrial Connectivity Based on Landsat/Sentinel Land
                      Cover Classes as a Biodiversity Indicator for the European
                      Green Deal Data Space,"
                    </em>
                    <br />
                    IGARSS 2024 - 2024 IEEE International Geoscience and Remote
                    Sensing Symposium, Athens, Greece, 2024, pp. 2328-2331.
                    <br />
                    DOI:{" "}
                    <a
                      href="https://doi.org/10.1109/IGARSS53475.2024.10640524"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      10.1109/IGARSS53475.2024.10640524
                    </a>
                  </li>
                </ul>
              </p>
            </Card>

            <Card
              title="What is the spatial resolution of the layers"
              bordered={false}
              style={{ width: "100%", height: "100%", borderRadius: "0.5rem" }}
            >
              <p>
                Given the time and machine cost of the algorithm and so the
                ground-truth available maps, the ML model has been trained in 2
                spatial resolutions: high resolution at 30 m and low resolution
                at 390 m. ICT results are then given to these 2 spatial
                resolutions and users need to choose first under which
                resolution they are working.{" "}
              </p>
            </Card>

            <Card
              title="From which year the map layers are available?"
              bordered={false}
              style={{ width: "100%", height: "100%", borderRadius: "0.5rem" }}
            >
              <p>
                ML model has been trained for every land use/cover class using
                ground-truth maps from the whole Catalan region on the following
                years:
                <ul style={{ marginTop: 8, marginBottom: 0 }}>
                  <li>
                    <strong>Low resolution (390 m):</strong> 1987, 1992, 1997,
                    2002, 2007, 2012, 2017, 2022
                  </li>
                  <li>
                    <strong>High resolution (30 m):</strong> 1987, 2022
                  </li>
                </ul>
                Based on these, BioConnect tool can give an estimation on future
                scenarios.
              </p>
            </Card>
          </Flex>
        </Col>
      </Row>
    </>
  );
};

export default bioConninformation;
