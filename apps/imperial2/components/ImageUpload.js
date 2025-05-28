import { CircularProgress } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import {S3Client, PutObjectCommand} from "@aws-sdk/client-s3";
const s3 = new S3Client({ credentials:{
  accessKeyId:'XWHXU4FP7MT2V842ITN9',
 secretAccessKey:'kf78BeufoEwwhSdecZCdcpZVJsIng6v5WFJM1Nm3'
}, region: "us-west-1", profile: "wasabi", endpoint: "https://s3.us-west-1.wasabisys.com/"  }); // for S3

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
      Bucket: "images1.pythiastechnologies.com",
      Key: key,
      Body: buffer,
      ACL: "public-read",
      ContentDisposition: "inline",
      ContentType: contentType,
    };
    const data = await s3.send(new PutObjectCommand(params));
    console.log("Success, object uploaded", data);
    return `https://images1.pythiastechnologies.com/${key}`;
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
