import { useEffect, useState, useCallback } from "react"
import { getNotes, createNote, deleteNote, updateItem } from '../api/NotesApi'
import { useContext } from "react"
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext"

function useNotes() {
    const [notes, setNotes] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const { accessToken, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleRequestError = useCallback((err) => {
        if (err.response?.status === 401) {
            logout();

            navigate("/login", {
                replace: true,
                state: {
                    message: "Your session has expired. Please log in again.",
                },
            });

            return;
        }

        setError(
            err.response?.data?.message ||
            "Something went wrong. Please try again."
        );
    }, [logout, navigate]);

    const fetchNotes = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        setError("");
        try {
            const fetchedNotes = await getNotes(accessToken);
            setNotes(fetchedNotes);
        } catch (err) {
            handleRequestError(err);
        } finally {
            setLoading(false);
        }
    }, [accessToken, handleRequestError]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional mount-time fetch; this is the standard data-fetch-on-mount pattern, not a cascading-render bug
        fetchNotes();
    }, [fetchNotes]);

    const addNote = async (NoteData) => {
        setError("")
        setLoading(true)
        try {
            const newNote = await createNote(NoteData, accessToken);
            setNotes((prev) => [newNote, ...prev])
            return newNote;
        }
        catch (err) { handleRequestError(err); }
        finally { setLoading(false) }
    }

    const editNote = async (noteId, noteData) => {
        setError("")
        setLoading(true)
        try {
            const updated = await updateItem(noteId, noteData, accessToken);
            setNotes((prev) => prev.map(t => t._id === noteId ? updated : t));
            return updated;
        }
        catch (err) { handleRequestError(err); }
        finally { setLoading(false) }
    }

    const removeNote = async (noteId) => {
        setError("")
        setLoading(true)
        try {
            await deleteNote(noteId, accessToken);
            setNotes((prev) => prev.filter(t => t._id !== noteId))
        }
        catch (err) { handleRequestError(err); }
        finally { setLoading(false) }
    }

    return { notes, loading, error, addNote, editNote, removeNote, fetchNotes }
}

export default useNotes;