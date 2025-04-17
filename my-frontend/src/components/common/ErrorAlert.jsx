"use client"

const ErrorAlert = ({ error, onDismiss }) => {
  if (!error) return null

  return (
    <div className="alert alert-danger alert-dismissible fade show" role="alert">
      <strong>Error:</strong> {error}
      {onDismiss && <button type="button" className="btn-close" onClick={onDismiss} aria-label="Close"></button>}
    </div>
  )
}

export default ErrorAlert

