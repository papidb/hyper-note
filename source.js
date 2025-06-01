import React, { useState, useEffect } from "react";
import { render, Text, Box, useInput, useApp } from "ink";
import TextInput from "ink-text-input";
import fs from "fs/promises";
import path from "path";

const NOTES_FILE = path.join("./", ".notes.json");

const NoteApp = () => {
  const [notes, setNotes] = useState([]);
  const [mode, setMode] = useState("list"); // list, add, edit, delete
  const [selectedNote, setSelectedNote] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const { exit } = useApp();

  // Load notes from file on mount
  useEffect(() => {
    async function loadNotes() {
      try {
        const data = await fs.readFile(NOTES_FILE, "utf8");
        setNotes(JSON.parse(data));
      } catch (error) {
        // If file doesn't exist, start with empty array
        setNotes([]);
      }
    }
    loadNotes();
  }, []);

  // Save notes to file whenever notes change
  useEffect(() => {
    async function saveNotes() {
      await fs.writeFile(NOTES_FILE, JSON.stringify(notes, null, 2));
    }
    saveNotes();
  }, [notes]);

  // Handle keyboard input
  useInput((input, key) => {
    if (key.escape) {
      setMode("list");
      setSelectedNote(null);
      setInputValue("");
    }

    if (mode === "list") {
      if (input === "q") {
        exit();
      }
      if (input === "a") {
        setMode("add");
      }
      if (input === "e" && notes.length > 0) {
        setMode("edit");
        setSelectedNote(0);
      }
      if (input === "d" && notes.length > 0) {
        setMode("delete");
        setSelectedNote(0);
      }
      if (key.upArrow && selectedNote > 0) {
        setSelectedNote(selectedNote - 1);
      }
      if (key.downArrow && selectedNote < notes.length - 1) {
        setSelectedNote(selectedNote + 1);
      }
    }
  });

  // Handle note submission
  const handleSubmit = async () => {
    if (mode === "add") {
      setNotes([...notes, { id: Date.now(), content: inputValue }]);
    } else if (mode === "edit" && selectedNote !== null) {
      const updatedNotes = notes.map((note, index) =>
        index === selectedNote ? { ...note, content: inputValue } : note
      );
      setNotes(updatedNotes);
    }
    setMode("list");
    setInputValue("");
    setSelectedNote(null);
  };

  // Handle note deletion
  const handleDelete = () => {
    if (mode === "delete" && selectedNote !== null) {
      setNotes(notes.filter((_, index) => index !== selectedNote));
      setMode("list");
      setSelectedNote(null);
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>📝 Terminal Note App</Text>
      <Text dimColor>
        {mode === "list" && "a: add, e: edit, d: delete, q: quit"}
        {mode !== "list" && "esc: cancel"}
      </Text>

      {mode === "list" && (
        <Box flexDirection="column" marginTop={1}>
          {notes.length === 0 ? (
            <Text>No notes yet. Press 'a' to add one.</Text>
          ) : (
            notes.map((note, index) => (
              <Text
                key={note.id}
                color={selectedNote === index ? "cyan" : "white"}
              >
                {selectedNote === index ? "➤ " : "  "} {note.content}
              </Text>
            ))
          )}
        </Box>
      )}

      {(mode === "add" || mode === "edit") && (
        <Box marginTop={1}>
          <Text>{mode === "add" ? "New note: " : "Edit note: "}</Text>
          <TextInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
          />
        </Box>
      )}

      {mode === "delete" && (
        <Box marginTop={1} flexDirection="column">
          <Text>Delete note: {notes[selectedNote]?.content}?</Text>
          <Text color="red">Press Enter to confirm, Esc to cancel</Text>
        </Box>
      )}
    </Box>
  );
};

render(<NoteApp />);
