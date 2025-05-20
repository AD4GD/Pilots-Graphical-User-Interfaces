import React, { useState } from "react";
import { InboxOutlined } from "@ant-design/icons";
import type { UploadProps, UploadFile } from "antd";
import { message, Upload } from "antd";

const { Dragger } = Upload;

// Custom event for notifying parent component about the uploaded file
export const FILE_UPLOADED_EVENT = "fileUploaded";

const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};

export const FileUpload: React.FC = () => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const props: UploadProps = {
    name: "file",
    multiple: false,
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        setIsUploading(true);
        const fileObj = file as File;

        // Read the file content
        const fileContent = await readFileAsText(fileObj);

        // Store the file in component state for later use
        // We'll dispatch a custom event to notify the parent component
        const uploadEvent = new CustomEvent(FILE_UPLOADED_EVENT, {
          detail: {
            file: fileObj,
            fileName: fileObj.name,
            fileContent,
          },
        });
        window.dispatchEvent(uploadEvent);

        // Simulate successful upload
        setTimeout(() => {
          onSuccess?.({}, new XMLHttpRequest());
          setIsUploading(false);
        }, 500);
      } catch (err: any) {
        console.error("Error processing file:", err);
        onError?.(err, new XMLHttpRequest());
        setIsUploading(false);
        message.error(
          `Failed to process ${(file as File).name}: ${err.message}`
        );
      }
    },
    fileList,
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
      setFileList(info.fileList.slice(-1)); // Keep only the last file
      const { status } = info.file;

      if (status === "done") {
        message.success(`${info.file.name} file processed successfully.`);
      } else if (status === "error") {
        message.error(`${info.file.name} file processing failed.`);
      }
    },
    onDrop(e) {
      console.log("Dropped files", e.dataTransfer.files);
    },
  };
  return (
    <Dragger {...props} style={{ padding: "4rem" }}>
      <p className="ant-upload-drag-icon">
        <InboxOutlined style={{ color: "#96f5d0" }} />
      </p>
      <p className="ant-upload-text">
        Click or drag a file to this area to upload
      </p>
      <p className="ant-upload-hint">
        Only tabular data files are allowed (CSV, Excel, JSON, XML, TXT). You
        can upload one file at a time.
      </p>
    </Dragger>
  );
};
