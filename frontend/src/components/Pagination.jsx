export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="d-flex justify-content-center mt-4 gap-2">
      <button
        className="btn btn-outline-secondary btn-sm rounded-3"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
      >
        &laquo; Trang trước
      </button>

      <span className="align-self-center small fw-bold px-2">
        Trang {page} / {totalPages}
      </span>

      <button
        className="btn btn-outline-secondary btn-sm rounded-3"
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Trang sau &raquo;
      </button>
    </div>
  );
}