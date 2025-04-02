import React from "react";
import { InboxOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import { message, Upload } from "antd";

const { Dragger } = Upload;

const props: UploadProps = {
  name: "file",
  multiple: false, // Allow only one file at a time
  action: "https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload",
  beforeUpload(file) {
    const allowedTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/json",
      "application/xml",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      message.error(
        "You can only upload files containing tabular data (CSV, Excel, JSON, XML, TXT)!"
      );
      return Upload.LIST_IGNORE; // Prevents file from being added to the upload list
    }

    return true; // Proceed with upload
  },
  onChange(info) {
    const { status } = info.file;
    if (status !== "uploading") {
      console.log(info.file, info.fileList);
    }
    if (status === "done") {
      message.success(`${info.file.name} file uploaded successfully.`);
    } else if (status === "error") {
      message.error(`${info.file.name} file upload failed.`);
    }
  },
  onDrop(e) {
    console.log("Dropped files", e.dataTransfer.files);
  },
};

export const FileUpload: React.FC = () => (
  <Dragger {...props} style={{ padding: "4rem" }}>
    <p className="ant-upload-drag-icon">
      <InboxOutlined style={{ color: "#96f5d0" }} />
    </p>
    <p className="ant-upload-text">
      Click or drag a file to this area to upload
    </p>
    <p className="ant-upload-hint">
      Only tabular data files are allowed (CSV, Excel, JSON, XML, TXT). You can
      upload one file at a time.
    </p>
  </Dragger>
);
