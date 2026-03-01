import "./Toast.css"

function Toast({ toast }) {
  if (!toast) return null;

  return (
    <div className={`toast toast-${toast.type}`}>
      {toast.message}
    </div>
  );
}

export default Toast;