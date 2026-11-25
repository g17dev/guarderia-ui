import "./ChildActionCard.css";

export default function ChildActionCard({ onSelect }: { onSelect: (action: "ENTREGAR" | "RECOGER") => void }) {
  return (
    <div className="card-container">
      <div className="buttons">
        <button
          className="btn entregar"
          onClick={() => onSelect("ENTREGAR")}
        >
            Entregar
        </button>

        <button
          className="btn recoger"
          onClick={() => onSelect("RECOGER")}
        >
            Recoger
        </button>
      </div>
    </div>
  );
}