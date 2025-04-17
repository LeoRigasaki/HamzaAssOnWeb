const LoadingSpinner = ({ size = "medium", text = "Loading..." }) => {
  const spinnerSize = size === "small" ? "spinner-border-sm" : ""

  return (
    <div className="d-flex justify-content-center align-items-center my-4">
      <div className={`spinner-border text-primary ${spinnerSize}`} role="status">
        <span className="visually-hidden">{text}</span>
      </div>
      {size !== "small" && <span className="ms-2">{text}</span>}
    </div>
  )
}

export default LoadingSpinner

