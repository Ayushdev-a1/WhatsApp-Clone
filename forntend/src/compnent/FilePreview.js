import { AiFillFilePdf, AiFillFileImage, AiFillFileUnknown } from "react-icons/ai"
import { FaDownload } from "react-icons/fa"
const FilePreview = ({ fileUrl, fileName, fileType, fileSize }) => {
  const getFileIcon = () => {
    if (fileType === "pdf") return <AiFillFilePdf style={{ color: "red", fontSize: "2rem" }} />
    if (fileType === "image") return <AiFillFileImage style={{ color: "green", fontSize: "2rem" }} />
    return <AiFillFileUnknown style={{ color: "gray", fontSize: "2rem" }} />
  }

  return (
    <div className="file-preview">
      <div className="file-icon">{getFileIcon()}</div>
      {fileType === "image" && (
        <img src={fileUrl} alt="file preview" style={{ maxWidth: "100%", maxHeight: "200px" }} />
      )}
      <div className="file-info">
        <span className="file-name">{fileName}</span>
        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="file-download">
          <FaDownload title="Download to your Device" />
        </a>
      </div>
    </div>
  )
}

export default FilePreview

