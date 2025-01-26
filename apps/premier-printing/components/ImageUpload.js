import { CircularProgress } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import AWS from "aws-sdk";

const awsConfig = {
  profile: "wasabi",
  region: "us-east-1",
  accessKeyId: "SZR8M2DE7TYQA88VYD3F",
  secretAccessKey: "jtegESHcnmYv2ZNE5mzLChZ0zeDBUaC3P8abTwh8",
};

const ImageUpload = ({ filesToUpload = [], onUploadComplete }) => {
  const s3Ref = useRef();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFiles = async (filesToUpload) => {
    setIsUploading(true);
    const urls = [];
    for (let file of filesToUpload) {
      let url;
      if (file.file) {
        url = await uploadImageFile(file.file, file.key);
      }
      if (file.base64) {
        url = await uploadBase64(file.base64, file.key);
      }
      urls.push(url);
    }
    console.log(urls);
    onUploadComplete(urls);
    setIsUploading(false);
  };

  useEffect(() => {
    if (filesToUpload?.length > 0) {
      uploadFiles(filesToUpload);
    }
  }, [filesToUpload]);

  const uploadToS3 = async (base64, key, contentType = "image/jpeg") => {
    if (key.includes(".png")) contentType = "image/png";
    if (key.includes(".webp")) contentType = "image/webp";
    let buffer = Buffer.from(base64.split(",")[1], "base64");
    var params = {
      Bucket: "teeshirtpalace-node-dev",
      Key: key,
      Body: buffer,
      ACL: "public-read",
      ContentDisposition: "inline",
      ContentType: contentType,
    };
    AWS.config.update(awsConfig);
    let ep = new AWS.Endpoint("s3.wasabisys.com");
    s3Ref.current = new AWS.S3({ endpoint: ep });
    await s3Ref.current.putObject(params).promise();
    return `https://s3.wasabisys.com/teeshirtpalace-node-dev/${key}`;
  };

  const uploadImageFile = async (file, key) => {
    let base64 = await getBase64Image(file);
    let url = await uploadToS3(base64, key);
    return url;
  };

  const uploadBase64 = async (base64, key) => {
    let url = await uploadToS3(base64, key);
    return url;
  };

  async function getBase64Image(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = function () {
        resolve(reader.result);
      };

      reader.onerror = function (error) {
        reject(error);
      };

      reader.readAsDataURL(file);
    });
  }

  return (
    <div className="d-flex justify-content-center align-items-center">
      {isUploading && <CircularProgress />}
    </div>
  );
};

export default ImageUpload;
