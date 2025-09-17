"use client";

import { cn } from "@/lib/utils";
import { ERROR_MESSAGES, IMAGE_CONSTRAINTS } from "@/utils/constants";
import { compressImage } from "@/utils/image-compression";
import {
  EmojiEmotions,
  FormatBold,
  FormatItalic,
  FormatListBulleted,
  FormatListNumbered,
  FormatQuote,
  FormatUnderlined,
  Image as ImageIcon,
  Redo,
  Undo,
} from "@mui/icons-material";
import {
  Box,
  Divider,
  IconButton,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";

// Lexical imports
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";

// Lexical nodes
import { LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
// Custom Image Node for Lexical
import { $createImageNode, ImageNode as CustomImageNode } from "./ImageNode";

import {
  $createParagraphNode,
  $createTextNode,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  EditorState,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
} from "lexical";

import { $generateHtmlFromNodes } from "@lexical/html";
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from "@lexical/list";
import { $createQuoteNode } from "@lexical/rich-text";

interface ForumRichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
}

export interface ForumRichTextEditorRef {
  uploadPendingImages: () => Promise<string>;
}

// Fun emoji shortcodes for forum use
const FORUM_EMOJIS = {
  ":horse:": "🐴",
  ":heart:": "❤️",
  ":smile:": "😊",
  ":thumbs-up:": "👍",
  ":unicorn:": "🦄",
  ":star:": "⭐",
  ":fire:": "🔥",
  ":rainbow:": "🌈",
  ":sparkles:": "✨",
  ":clap:": "👏",
  ":thinking:": "🤔",
  ":laugh:": "😂",
  ":sad:": "😢",
  ":angry:": "😡",
  ":helpful:": "💡",
};

// Toolbar Component
function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [activeFormats] = useState<string[]>([]);
  const [showEmojiHelp, setShowEmojiHelp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFormat = (format: "bold" | "italic" | "underline") => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const handleList = (listType: "bullet" | "number") => {
    if (listType === "bullet") {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    }
  };

  const handleQuote = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const quote = $createQuoteNode();
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(""));
        quote.append(paragraph);
        $insertNodes([quote]);
      }
    });
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Kun bildefiler er tillatt");
      return;
    }

    try {
      // Compress first, then validate size
      const compressionResult = await compressImage(file, {
        maxSizeMB: IMAGE_CONSTRAINTS.MAX_FILE_SIZE / (1024 * 1024),
        maxWidthOrHeight: 1920,
      });

      const compressedFile = compressionResult.file;

      if (compressedFile.size > IMAGE_CONSTRAINTS.MAX_FILE_SIZE) {
        alert(ERROR_MESSAGES.IMAGE_TOO_LARGE);
        return;
      }

      // Convert compressed file to base64 for immediate preview
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(compressedFile);
      });

      // Insert image into editor
      editor.update(() => {
        const imageNode = $createImageNode({
          src: base64Image,
          altText: "Uploaded image",
          maxWidth: 400,
        });
        $insertNodes([imageNode]);
      });

      console.log("Image inserted successfully with Lexical");
    } catch (error) {
      console.error("Image processing failed:", error);
      alert("Feil ved behandling av bilde. Prøv igjen.");
    }

    // Reset file input
    event.target.value = "";
  };

  const insertEmoji = (emoji: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.insertText(emoji);
      }
    });
  };

  return (
    <Box
      sx={{
        p: 1,
        borderBottom: 1,
        borderColor: "divider",
        backgroundColor: "grey.50",
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        <ToggleButtonGroup
          value={activeFormats}
          size="small"
          sx={{ "& .MuiToggleButton-root": { px: 1, py: 0.5 } }}
        >
          <ToggleButton value="bold" onClick={() => handleFormat("bold")} sx={{ border: "none" }}>
            <FormatBold fontSize="small" />
          </ToggleButton>

          <ToggleButton
            value="italic"
            onClick={() => handleFormat("italic")}
            sx={{ border: "none" }}
          >
            <FormatItalic fontSize="small" />
          </ToggleButton>

          <ToggleButton
            value="underline"
            onClick={() => handleFormat("underline")}
            sx={{ border: "none" }}
          >
            <FormatUnderlined fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>

        <Divider orientation="vertical" flexItem />

        <ToggleButtonGroup
          value={activeFormats}
          size="small"
          sx={{ "& .MuiToggleButton-root": { px: 1, py: 0.5 } }}
        >
          <ToggleButton
            value="bulletList"
            onClick={() => handleList("bullet")}
            sx={{ border: "none" }}
          >
            <FormatListBulleted fontSize="small" />
          </ToggleButton>

          <ToggleButton
            value="orderedList"
            onClick={() => handleList("number")}
            sx={{ border: "none" }}
          >
            <FormatListNumbered fontSize="small" />
          </ToggleButton>

          <ToggleButton value="blockquote" onClick={handleQuote} sx={{ border: "none" }}>
            <FormatQuote fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>

        <Divider orientation="vertical" flexItem />

        <Tooltip title="Last opp bilde" placement="top">
          <IconButton size="small" onClick={handleImageUpload}>
            <ImageIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Klikk for å se emoji-koder" placement="top">
          <IconButton
            size="small"
            onClick={() => setShowEmojiHelp(!showEmojiHelp)}
            color={showEmojiHelp ? "primary" : "default"}
          >
            <EmojiEmotions fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem />

        <IconButton size="small" onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}>
          <Undo fontSize="small" />
        </IconButton>

        <IconButton size="small" onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}>
          <Redo fontSize="small" />
        </IconButton>
      </Stack>

      {/* Emoji Help */}
      {showEmojiHelp && (
        <Box sx={{ mt: 2, p: 2, backgroundColor: "background.paper", borderRadius: 1 }}>
          <Typography className="text-body-sm" sx={{ mb: 1, fontWeight: 500 }}>
            Skriv disse kodene for emojis:
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {Object.entries(FORUM_EMOJIS).map(([code, emoji]) => (
              <Box
                key={code}
                onClick={() => insertEmoji(emoji)}
                sx={{
                  cursor: "pointer",
                  px: 1,
                  py: 0.5,
                  backgroundColor: "grey.100",
                  borderRadius: 1,
                  fontSize: "0.8rem",
                  "&:hover": {
                    backgroundColor: "grey.200",
                  },
                }}
              >
                {emoji} {code}
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileSelect}
      />
    </Box>
  );
}

export const ForumRichTextEditor = forwardRef<ForumRichTextEditorRef, ForumRichTextEditorProps>(
  (
    { content, onChange, placeholder = "Skriv ditt innlegg her...", className, minHeight = 150 },
    ref
  ) => {
    // Upload all pending images when form is submitted
    const uploadPendingImages = useCallback(async (): Promise<string> => {
      // For now, just return the content as-is since we're using base64 temporarily
      // In the future, we can implement the same logic as before to replace base64 with real URLs
      return content;
    }, [content]);

    // Expose methods to parent component
    useImperativeHandle(
      ref,
      () => ({
        uploadPendingImages,
      }),
      [uploadPendingImages]
    );

    const initialConfig = {
      namespace: "ForumEditor",
      theme: {
        paragraph: "mb-1",
        quote: "border-l-4 border-l-gray-300 pl-4 ml-0 italic text-gray-600",
        list: {
          ul: "list-disc pl-4",
          ol: "list-decimal pl-4",
        },
      },
      onError: (error: Error) => {
        console.error("Lexical error:", error);
      },
      nodes: [HeadingNode, ListNode, ListItemNode, QuoteNode, LinkNode, CustomImageNode],
    };

    // Content change handler component that has access to editor context
    function OnChangeHandler({ onChange }: { onChange: (content: string) => void }) {
      const [editor] = useLexicalComposerContext();

      const handleChange = (editorState: EditorState) => {
        editorState.read(() => {
          const htmlString = $generateHtmlFromNodes(editor, null);
          onChange(htmlString);
        });
      };

      return <OnChangePlugin onChange={handleChange} />;
    }

    return (
      <Paper
        variant="outlined"
        className={cn("overflow-hidden", className)}
        sx={{ borderRadius: 2 }}
      >
        <LexicalComposer initialConfig={initialConfig}>
          <ToolbarPlugin />

          {/* Editor */}
          <Box
            sx={{
              backgroundColor: "background.paper",
              minHeight: `${minHeight}px`,
              "& .editor-input": {
                outline: "none",
                padding: "12px",
                minHeight: `${minHeight}px`,
              },
              "& .editor-placeholder": {
                color: "text.disabled",
                pointerEvents: "none",
                position: "absolute",
                top: "12px",
                left: "12px",
              },
            }}
          >
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className="editor-input"
                  style={{
                    minHeight: `${minHeight}px`,
                    outline: "none",
                  }}
                />
              }
              // placeholder={<div className="editor-placeholder">{placeholder}</div>}
              ErrorBoundary={LexicalErrorBoundary}
            />

            <OnChangeHandler onChange={onChange} />
            <HistoryPlugin />
            <ListPlugin />
            <LinkPlugin />
          </Box>
        </LexicalComposer>
      </Paper>
    );
  }
);

ForumRichTextEditor.displayName = "ForumRichTextEditor";
