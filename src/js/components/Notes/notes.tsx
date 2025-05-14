import React, { useState, useEffect } from "react";
import {
  Button,
  Input,
  Card,
  Space,
  Typography,
  Popconfirm,
  message,
  ConfigProvider,
} from "antd";
import {
  PlusOutlined,
  SaveOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import Parse from "parse";

const { TextArea } = Input;
const { Text } = Typography;

interface Note {
  id: string;
  content: string;
  timestamp: string;
}

interface NotesProps {
  lakeId?: string;
  currentUser?: Parse.User;
}

const Notes: React.FC<NotesProps> = ({ lakeId, currentUser }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentNote, setCurrentNote] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [lakeNotesObject, setLakeNotesObject] = useState<Parse.Object | null>(
    null
  );

  useEffect(() => {
    fetchLakeNotes();
  }, [lakeId, currentUser]);

  const fetchLakeNotes = async () => {
    if (!currentUser || !lakeId) return;

    setLoading(true);
    try {
      const LakeNotes = Parse.Object.extend("AD4GD_LakeNotes");
      const query = new Parse.Query(LakeNotes);
      query.equalTo("user", currentUser);
      query.equalTo(
        "lake",
        new Parse.Object("MIAAS_Geographies").set("objectId", lakeId)
      );
      const results = await query.first();

      if (results) {
        setLakeNotesObject(results);
        const savedNotes = results.get("notes") || [];
        setNotes(savedNotes);
      } else {
        setLakeNotesObject(null);
        setNotes([]);
      }
    } catch (error) {
      message.error("Failed to fetch notes");
      console.error("Error fetching notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentTimestamp = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")} ${now.getDate().toString().padStart(2, "0")}/${(
      now.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${now.getFullYear()}`;
  };

  const handleAddNote = () => {
    setIsEditing(true);
    setEditingId(null);
    setCurrentNote("");
  };

  const handleSaveNote = async () => {
    if (!currentNote.trim()) {
      console.log("Empty note - returning");
      return;
    }
    if (!currentUser || !lakeId) {
      console.log("Missing user or lakeId - returning");
      return;
    }

    setLoading(true);
    try {
      const timestamp = getCurrentTimestamp();
      let updatedNotes: Note[] = [];
      if (editingId) {
        updatedNotes = notes.map((note) =>
          note.id === editingId
            ? { ...note, content: currentNote, timestamp }
            : note
        );
      } else {
        updatedNotes = [
          ...notes,
          {
            id: Date.now().toString(),
            content: currentNote,
            timestamp,
          },
        ];
      }

      const LakeNotes = Parse.Object.extend("AD4GD_LakeNotes");
      let lakeNotes: Parse.Object;

      if (lakeNotesObject) {
        lakeNotes = lakeNotesObject;
      } else {
        lakeNotes = new LakeNotes();
        lakeNotes.set("user", currentUser);
        lakeNotes.set(
          "lake",
          new Parse.Object("MIAAS_Geographies").set("objectId", lakeId)
        );

        const acl = new Parse.ACL();
        acl.setReadAccess(currentUser, true);
        acl.setWriteAccess(currentUser, true);
        lakeNotes.setACL(acl);
      }

      lakeNotes.set("notes", updatedNotes);
      const savedObject = await lakeNotes.save();

      setLakeNotesObject(savedObject);
      setNotes(updatedNotes);
      setIsEditing(false);
      setEditingId(null);
      message.success("Note saved successfully");
    } catch (error) {
      message.error("Failed to save note");
      console.error("Error saving note:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditNote = (note: Note) => {
    setIsEditing(true);
    setEditingId(note.id);
    setCurrentNote(note.content);
  };

  const handleDeleteNote = async (id: string) => {
    if (!lakeNotesObject) return;

    setLoading(true);
    try {
      const updatedNotes = notes.filter((note) => note.id !== id);

      if (updatedNotes.length === 0) {
        // If no notes left, delete the entire object
        await lakeNotesObject.destroy();
        setLakeNotesObject(null);
      } else {
        // Otherwise just update the notes array
        lakeNotesObject.set("notes", updatedNotes);
        await lakeNotesObject.save();
      }

      setNotes(updatedNotes);
      message.success("Note deleted successfully");
    } catch (error) {
      message.error("Failed to delete note");
      console.error("Error deleting note:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentNote(e.target.value);
  };

  return (
    <div style={{ width: "100%", margin: "0 auto" }}>
      <ConfigProvider
        wave={{ disabled: true }}
        theme={{
          token: {
            colorPrimary: "#96F5D0",
            colorTextLightSolid: "black",
            borderRadius: 6,
            fontSize: 16,
          },
        }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddNote}
            loading={loading}
          >
            Fügen Sie eine Notiz zu diesem See hinzu
          </Button>

          {notes.map((note) => (
            <Card key={note.id} style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ flex: 1 }}>
                  <div
                    style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                  >
                    {note.content}
                  </div>
                  <Text
                    type="secondary"
                    style={{
                      display: "block",
                      marginTop: "8px",
                      fontSize: "12px",
                    }}
                  >
                    {note.timestamp}
                  </Text>
                </div>
                <div style={{ marginLeft: "16px" }}>
                  <Space>
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => handleEditNote(note)}
                      disabled={loading}
                    />
                    <Popconfirm
                      title="Notiz löschen?"
                      onConfirm={() => handleDeleteNote(note.id)}
                      okText="Ja"
                      cancelText="Nein"
                      disabled={loading}
                    >
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        disabled={loading}
                      />
                    </Popconfirm>
                  </Space>
                </div>
              </div>
            </Card>
          ))}

          {isEditing && (
            <div style={{ position: "relative" }}>
              <TextArea
                value={currentNote}
                onChange={handleNoteChange}
                placeholder="Type your note here..."
                autoSize={{ minRows: 3, maxRows: 6 }}
                style={{
                  marginBottom: "40px",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
                disabled={loading}
              />
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSaveNote}
                loading={loading}
                style={{
                  position: "absolute",
                  right: 0,
                  bottom: 0,
                }}
              >
                Notiz speichen
              </Button>
            </div>
          )}
        </Space>
      </ConfigProvider>
    </div>
  );
};

export default Notes;
