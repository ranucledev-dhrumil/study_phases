import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL
const ITEMS_URL = `${BASE_URL}/items`

async function getNotes(accessToken) {
    try {
        const resp = await axios.get(ITEMS_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
        return resp.data;
    }
    catch (err) {
        console.error("Error fetching items:", err);
        throw err;
    }
}

async function createNote(itemData, accessToken) {
    try {
        let url = ITEMS_URL;
        if (itemData.type === 'note') url = `${ITEMS_URL}/notes`;
        else if (itemData.type === 'snippet') url = `${ITEMS_URL}/snippets`;
        else if (itemData.type === 'link') url = `${ITEMS_URL}/links`;

        const resp = await axios.post(url, itemData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
        return resp.data;
    }
    catch (err) {
        console.error("Error creating item:", err);
        throw err;
    }
}

async function deleteNote(itemId, accessToken) {
    try {
        const resp = await axios.delete(`${ITEMS_URL}/${itemId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
        return resp.data;
    }
    catch (err) {
        console.error("Error deleting item:", err);
        throw err;
    }
}

async function getItem(itemId, accessToken) {
    try {
        const resp = await axios.get(`${ITEMS_URL}/${itemId}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return resp.data;
    } catch (err) {
        console.error("Error fetching item:", err);
        throw err;
    }
}

async function updateItem(itemId, itemData, accessToken) {
    try {
        const resp = await axios.put(`${ITEMS_URL}/${itemId}`, itemData, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return resp.data;
    } catch (err) {
        console.error("Error updating item:", err);
        throw err;
    }
}

async function getGraph(accessToken) {
    try {
        const resp = await axios.get(`${ITEMS_URL}/graph`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return resp.data;
    } catch (err) {
        console.error("Error fetching graph data:", err);
        throw err;
    }
}

export { getNotes, createNote, deleteNote, getItem, updateItem, getGraph }