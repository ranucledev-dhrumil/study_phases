// NoteForm.jsx
import { useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";

function NoteForm({
  onAddNote,
  onUpdateNote,
  initialItem = null,
  existingItems = [],
}) {
  const [searchParams] = useSearchParams();
  const createTitleParam = searchParams.get("createTitle");

  const [type, setType] = useState(initialItem?.type || "note");
  const [title, setTitle] = useState(
    initialItem?.title || createTitleParam || "",
  );
  const [content, setContent] = useState(initialItem?.content || "");
  const [code, setCode] = useState(initialItem?.code || "");
  const [language, setLanguage] = useState(
    initialItem?.language || "javascript",
  );
  const [url, setUrl] = useState(initialItem?.url || "");
  const [description, setDescription] = useState(
    initialItem?.description || "",
  );
  const [tagsInput, setTagsInput] = useState(
    initialItem?.tags ? initialItem.tags.join(", ") : "",
  );

  const [autocomplete, setAutocomplete] = useState({
    active: false,
    query: "",
    targetField: null,
    cursorPos: 0,
    options: [],
  });

  const textareaRef = useRef(null);

  const handleTextChange = (field, value, targetElem) => {
    if (field === "content") setContent(value);
    if (field === "code") setCode(value);
    if (field === "description") setDescription(value);

    // Detect [[
    const cursor = targetElem.selectionStart;
    const textBeforeCursor = value.slice(0, cursor);
    const lastOpenIndex = textBeforeCursor.lastIndexOf("[[");

    if (lastOpenIndex !== -1) {
      const textAfterOpen = textBeforeCursor.slice(lastOpenIndex + 2);
      // Check if there is no closing ]] between last [[ and cursor, and no newline
      if (!textAfterOpen.includes("]]") && !textAfterOpen.includes("\n")) {
        const query = textAfterOpen.trim().toLowerCase();
        const matches = existingItems.filter(
          (item) => item.title && item.title.toLowerCase().includes(query),
        );

        setAutocomplete({
          active: true,
          query: textAfterOpen,
          targetField: field,
          cursorPos: cursor,
          openIndex: lastOpenIndex,
          options: matches.slice(0, 5),
        });
        return;
      }
    }

    setAutocomplete({
      active: false,
      query: "",
      targetField: null,
      cursorPos: 0,
      options: [],
    });
  };

  const insertLink = (selectedTitle) => {
    const { targetField, openIndex, cursorPos } = autocomplete;
    let currentVal =
      targetField === "content"
        ? content
        : targetField === "code"
          ? code
          : description;

    const before = currentVal.slice(0, openIndex);
    const after = currentVal.slice(cursorPos);
    const newVal = `${before}[[${selectedTitle}]] ${after}`;

    if (targetField === "content") setContent(newVal);
    if (targetField === "code") setCode(newVal);
    if (targetField === "description") setDescription(newVal);

    setAutocomplete({
      active: false,
      query: "",
      targetField: null,
      cursorPos: 0,
      options: [],
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const tags = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "");

    let payload = { type, tags };

    if (type === "note") {
      if (!title.trim() || !content.trim()) return;
      payload = { ...payload, title: title.trim(), content: content.trim() };
    } else if (type === "snippet") {
      if (!title.trim() || !code.trim() || !language.trim()) return;
      payload = {
        ...payload,
        title: title.trim(),
        code: code.trim(),
        language: language.trim(),
      };
    } else if (type === "link") {
      if (!url.trim()) return;
      payload = {
        ...payload,
        title: title.trim(),
        url: url.trim(),
        description: description.trim(),
      };
    }

    if (initialItem && onUpdateNote) {
      onUpdateNote(initialItem._id, payload);
    } else if (onAddNote) {
      onAddNote(payload);
      if (!initialItem) {
        setTitle("");
        setContent("");
        setCode("");
        setUrl("");
        setDescription("");
        setTagsInput("");
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative mx-auto mb-8 flex max-w-2xl flex-col gap-3 rounded-xl bg-white p-6 shadow-md border border-gray-100"
    >
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex gap-4">
          {["note", "snippet", "link"].map((t) => (
            <label key={t} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="type"
                value={t}
                checked={type === t}
                disabled={!!initialItem}
                onChange={(e) => setType(e.target.value)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium capitalize text-gray-700">
                {t}
              </span>
            </label>
          ))}
        </div>
        <span className="text-xs text-gray-400">
          Tip: Type <code>[[</code> to link notes
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-sm font-medium text-gray-700">
          Title {type === "link" && "(Optional, auto-fetched if blank)"}
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={`Enter ${type} title`}
          className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 text-sm"
        />
      </div>

      {type === "note" && (
        <div className="relative flex flex-col gap-1">
          <label
            htmlFor="content"
            className="text-sm font-medium text-gray-700"
          >
            Content
          </label>
          <div className="flex justify-end mb-1">
            <button
              type="button"
              onClick={() => {
                const el = textareaRef.current;
                if (!el) return;
                const start = el.selectionStart;
                const end = el.selectionEnd;
                if (start === end) return; // nothing selected
                const before = content.slice(0, start);
                const selected = content.slice(start, end);
                const after = content.slice(end);
                const newVal = `${before}==${selected}==${after}`;
                setContent(newVal);
                // restore focus + selection after React re-renders
                requestAnimationFrame(() => {
                  el.focus();
                  el.setSelectionRange(start + 2, end + 2);
                });
              }}
              className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800 hover:bg-yellow-200 font-medium"
              title="Highlight selected text"
            >
              Highlight
            </button>
          </div>
          <textarea
            id="content"
            ref={textareaRef}
            value={content}
            onChange={(e) =>
              handleTextChange("content", e.target.value, e.target)
            }
            placeholder="Write your note... Use [[Note Title]] to link"
            rows={5}
            className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 text-sm"
          />
        </div>
      )}

      {type === "snippet" && (
        <>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="language"
              className="text-sm font-medium text-gray-700"
            >
              Language
            </label>
            <input
              id="language"
              type="text"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="e.g. javascript, python, rust"
              className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 text-sm"
            />
          </div>
          <div className="relative flex flex-col gap-1">
            <label htmlFor="code" className="text-sm font-medium text-gray-700">
              Code
            </label>
            <textarea
              id="code"
              value={code}
              onChange={(e) =>
                handleTextChange("code", e.target.value, e.target)
              }
              placeholder="Paste your code snippet here..."
              rows={5}
              className="font-mono rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 text-sm"
            />
          </div>
        </>
      )}

      {type === "link" && (
        <>
          <div className="flex flex-col gap-1">
            <label htmlFor="url" className="text-sm font-medium text-gray-700">
              URL
            </label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 text-sm"
              required
            />
          </div>
          <div className="relative flex flex-col gap-1">
            <label
              htmlFor="description"
              className="text-sm font-medium text-gray-700"
            >
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) =>
                handleTextChange("description", e.target.value, e.target)
              }
              placeholder="Add a brief description... Can also use [[wiki-links]]"
              rows={2}
              className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 text-sm"
            />
          </div>
        </>
      )}

      {/* Autocomplete Popup */}
      {autocomplete.active && autocomplete.options.length > 0 && (
        <div className="absolute z-50 left-6 right-6 bottom-20 bg-white border border-blue-200 rounded-lg shadow-xl p-2 max-h-48 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-400 px-2 py-1 uppercase tracking-wider">
            Link to note:
          </div>
          {autocomplete.options.map((item) => (
            <button
              key={item._id}
              type="button"
              onClick={() => insertLink(item.title)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 rounded flex items-center justify-between text-gray-800 transition"
            >
              <span className="font-medium">[[{item.title}]]</span>
              <span className="text-xs text-gray-400 uppercase">
                {item.type}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="tags" className="text-sm font-medium text-gray-700">
          Tags
        </label>
        <input
          id="tags"
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="react, vault, graph"
          className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 text-sm"
        />
      </div>

      <button
        type="submit"
        className="mt-2 rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 capitalize transition shadow-sm"
      >
        {initialItem ? "Save Changes" : `Add ${type}`}
      </button>
    </form>
  );
}

export default NoteForm;
