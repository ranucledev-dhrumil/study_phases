import "./App.css";
import { useState } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Link from "@mui/material/Link";
import Checkbox from "@mui/material/Checkbox";

const theme = createTheme({
  palette: {
    primary: { main: "#723231" },
    secondary: { main: "#FF6584" },
  },
  typography: {
    fontFamily: "Poppins, sans-serif",
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <BookmarkApp />
    </ThemeProvider>
  );
}

function BookmarkApp() {
  const [bookmarks, setBookmarks] = useState([
    {
      id: 1,
      title: "React",
      url: "https://react.dev",
      favorite: false,
    },
    {
      id: 2,
      title: "MDN Web Docs",
      url: "https://developer.mozilla.org",
      favorite: true,
    },
    {
      id: 3,
      title: "JavaScript Info",
      url: "https://javascript.info",
      favorite: false,
    },
  ]);

  const [filter, setFilter] = useState("all");

  const onAddBookmark = (bookmark) => {
    setBookmarks((currentBookmarks) => [...currentBookmarks, bookmark]);
  };

  const onToggleFavorite = (id) => {
    setBookmarks((currentBookmarks) =>
      currentBookmarks.map((bookmark) =>
        bookmark.id === id
          ? {
              ...bookmark,
              favorite: !bookmark.favorite,
            }
          : bookmark,
      ),
    );
  };

  const onDeleteBookmark = (id) => {
    setBookmarks((currentBookmarks) =>
      currentBookmarks.filter((bookmark) => bookmark.id !== id),
    );
  };

  // Count favorites from the FULL bookmarks array
  const favoriteCount = bookmarks.filter(
    (bookmark) => bookmark.favorite,
  ).length;

  // Derived list — don't store filtered bookmarks in state
  const visibleBookmarks = bookmarks.filter((bookmark) => {
    if (filter === "favorites") {
      return bookmark.favorite;
    }

    return true;
  });

  return (
    <div>
      <h1>Bookmark Manager</h1>

      <BookmarkForm onAddBookmark={onAddBookmark} />

      <p>
        {favoriteCount} of {bookmarks.length} bookmarks favorited
      </p>

      <Stack direction="row" spacing={1}>
        <Button
          variant={filter === "all" ? "contained" : "outlined"}
          onClick={() => setFilter("all")}
        >
          All
        </Button>
        <Button
          variant={filter === "favorites" ? "contained" : "outlined"}
          onClick={() => setFilter("favorites")}
        >
          Favorites only
        </Button>
      </Stack>

      <BookmarkList
        bookmarks={visibleBookmarks}
        onToggleFavorite={onToggleFavorite}
        onDeleteBookmark={onDeleteBookmark}
      />
    </div>
  );
}

function BookmarkForm({ onAddBookmark }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim() || !url.trim()) {
      return;
    }

    const bookmark = {
      id: Date.now(),
      title: title.trim(),
      url: url.trim(),
      favorite: false,
    };

    onAddBookmark(bookmark);

    setTitle("");
    setUrl("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack direction="row" spacing={2} alignItems="center">
        <TextField
          label="Title"
          size="small"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <TextField
          label="URL"
          size="small"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <Button type="submit" variant="contained">
          Add
        </Button>
      </Stack>
    </form>
  );
}

function BookmarkList({ bookmarks, onToggleFavorite, onDeleteBookmark }) {
  return (
    <Stack spacing={1}>
      {bookmarks.map((bookmark) => (
        <BookmarkItem
          key={bookmark.id}
          bookmark={bookmark}
          onToggleFavorite={onToggleFavorite}
          onDeleteBookmark={onDeleteBookmark}
        />
      ))}
    </Stack>
  );
}

function BookmarkItem({ bookmark, onToggleFavorite, onDeleteBookmark }) {
  return (
    <Box
      sx={{
        backgroundColor: bookmark.favorite ? "warning.light" : "transparent",
      }}
    >
      <Checkbox
        checked={bookmark.favorite}
        onChange={() => onToggleFavorite(bookmark.id)}
      />

      <Link href={bookmark.url} target="_blank" rel="noopener noreferrer">
        {bookmark.title}
      </Link>

      <Button
        onClick={() => onDeleteBookmark(bookmark.id)}
        color="error"
        variant="outlined"
      >
        Delete
      </Button>
    </Box>
  );
}

export default App;
