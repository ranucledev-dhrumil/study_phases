import './Spinner.css';

export default function Spinner({ size = '24px' }: { size?: string }) {
  return (
    <div className="spinner" style={{ width: size, height: size }} aria-label="Loading..." role="status">
      <svg viewBox="0 0 50 50" className="spinner__svg">
        <circle className="spinner__path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
      </svg>
    </div>
  );
}
