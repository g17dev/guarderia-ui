import { useState } from "react";
import "./ProfileTabs.css";

export function NotesTab({ childId }: { childId: string }) {
  const [notes, setNotes] = useState([
    { id: "1", text: "Prefiere quedarse cerca del educador durante actividades nuevas.", date: "2024-03-10", author: "Maestra Ana" },
    { id: "2", text: "Progreso notable en actividades de motricidad fina esta semana.", date: "2024-03-05", author: "Maestra Ana" },
  ]);
  const [newNote, setNewNote] = useState("");

  const addNote = () => {
    if (!newNote.trim()) return;
    setNotes(prev => [{
      id: crypto.randomUUID(),
      text: newNote.trim(),
      date: new Date().toISOString().split("T")[0],
      author: "Usuario actual",
    }, ...prev]);
    setNewNote("");
  };

  return (
    <div className="tab-content">
      <div className="notes-input-area">
        <textarea
          className="notes-textarea"
          rows={3}
          placeholder="Escribe una nota sobre el niño..."
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
        />
        <button className="notes-save-btn" onClick={addNote} disabled={!newNote.trim()}>
          Guardar nota
        </button>
      </div>

      <div className="notes-list">
        {notes.map(note => (
          <div key={note.id} className="note-item">
            <p className="note-text">{note.text}</p>
            <div className="note-meta">
              <span className="note-author">{note.author}</span>
              <span className="note-date">
                {new Date(note.date).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}