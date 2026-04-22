function PrimaryButton({ children, type = 'button', onClick }) {
  return (
    <button className="btn btn-primary" type={type} onClick={onClick}>
      {children}
    </button>
  )
}

export default PrimaryButton
