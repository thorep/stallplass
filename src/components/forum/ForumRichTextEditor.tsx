'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { 
  ToggleButton, 
  ToggleButtonGroup, 
  Divider,
  Stack,
  Box,
  Typography,
  IconButton,
  Tooltip,
  Paper
} from '@mui/material';
import { 
  FormatBold, 
  FormatItalic, 
  FormatUnderlined,
  FormatListBulleted, 
  FormatListNumbered, 
  FormatQuote,
  Undo,
  Redo,
  Link as LinkIcon,
  EmojiEmotions
} from '@mui/icons-material';
import { cn } from '@/lib/utils';
import React, { useState } from 'react';

interface ForumRichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
}

// Fun emoji shortcodes for forum use
const FORUM_EMOJIS = {
  ':horse:': '🐴',
  ':heart:': '❤️',
  ':smile:': '😊',
  ':thumbs-up:': '👍',
  ':unicorn:': '🦄',
  ':star:': '⭐',
  ':fire:': '🔥',
  ':rainbow:': '🌈',
  ':sparkles:': '✨',
  ':clap:': '👏',
  ':thinking:': '🤔',
  ':laugh:': '😂',
  ':sad:': '😢',
  ':angry:': '😡',
  ':helpful:': '💡'
};

export function ForumRichTextEditor({ 
  content, 
  onChange, 
  placeholder = 'Skriv ditt innlegg her...', 
  className,
  minHeight = 150
}: ForumRichTextEditorProps) {
  const [showEmojiHelp, setShowEmojiHelp] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Keep it simple for forum posts
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline'
        }
      }),
      Underline
    ],
    content,
    immediatelyRender: false, // Fix SSR hydration mismatch
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none p-3`,
        style: `min-height: ${minHeight}px;`
      },
      // Transform emoji shortcodes as user types
      handleTextInput: (view, from, to, text) => {
        const emoji = FORUM_EMOJIS[text as keyof typeof FORUM_EMOJIS];
        if (emoji) {
          view.dispatch(
            view.state.tr.replaceWith(from - text.length + 1, to, view.state.schema.text(emoji))
          );
          return true;
        }
        return false;
      }
    }
  });

  if (!editor) {
    return null;
  }

  const addLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Legg til lenke:', previousUrl);
    
    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const insertEmoji = (emoji: string) => {
    editor.chain().focus().insertContent(emoji).run();
  };

  const activeFormats = [];
  if (editor.isActive('bold')) activeFormats.push('bold');
  if (editor.isActive('italic')) activeFormats.push('italic');
  if (editor.isActive('underline')) activeFormats.push('underline');
  if (editor.isActive('bulletList')) activeFormats.push('bulletList');
  if (editor.isActive('orderedList')) activeFormats.push('orderedList');
  if (editor.isActive('blockquote')) activeFormats.push('blockquote');

  return (
    <Paper 
      variant="outlined" 
      className={cn("overflow-hidden", className)}
      sx={{ borderRadius: 2 }}
    >
      {/* Toolbar */}
      <Box 
        sx={{ 
          p: 1, 
          borderBottom: 1, 
          borderColor: 'divider',
          backgroundColor: 'grey.50'
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <ToggleButtonGroup
            value={activeFormats}
            size="small"
            sx={{ '& .MuiToggleButton-root': { px: 1, py: 0.5 } }}
          >
            <ToggleButton
              value="bold"
              onClick={() => editor.chain().focus().toggleBold().run()}
              sx={{ border: 'none' }}
            >
              <FormatBold fontSize="small" />
            </ToggleButton>
            
            <ToggleButton
              value="italic"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              sx={{ border: 'none' }}
            >
              <FormatItalic fontSize="small" />
            </ToggleButton>
            
            <ToggleButton
              value="underline"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              sx={{ border: 'none' }}
            >
              <FormatUnderlined fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>

          <Divider orientation="vertical" flexItem />

          <ToggleButtonGroup
            value={activeFormats}
            size="small"
            sx={{ '& .MuiToggleButton-root': { px: 1, py: 0.5 } }}
          >
            <ToggleButton
              value="bulletList"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              sx={{ border: 'none' }}
            >
              <FormatListBulleted fontSize="small" />
            </ToggleButton>
            
            <ToggleButton
              value="orderedList"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              sx={{ border: 'none' }}
            >
              <FormatListNumbered fontSize="small" />
            </ToggleButton>
            
            <ToggleButton
              value="blockquote"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              sx={{ border: 'none' }}
            >
              <FormatQuote fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>

          <Divider orientation="vertical" flexItem />

          <IconButton
            size="small"
            onClick={addLink}
            color={editor.isActive('link') ? 'primary' : 'default'}
          >
            <LinkIcon fontSize="small" />
          </IconButton>

          <Tooltip title="Klikk for å se emoji-koder" placement="top">
            <IconButton
              size="small"
              onClick={() => setShowEmojiHelp(!showEmojiHelp)}
              color={showEmojiHelp ? 'primary' : 'default'}
            >
              <EmojiEmotions fontSize="small" />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem />

          <IconButton
            size="small"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo fontSize="small" />
          </IconButton>
          
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo fontSize="small" />
          </IconButton>
        </Stack>

        {/* Emoji Help */}
        {showEmojiHelp && (
          <Box sx={{ mt: 2, p: 2, backgroundColor: 'background.paper', borderRadius: 1 }}>
            <Typography className="text-body-sm" sx={{ mb: 1, fontWeight: 500 }}>
              Skriv disse kodene for emojis:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.entries(FORUM_EMOJIS).map(([code, emoji]) => (
                <Box
                  key={code}
                  onClick={() => insertEmoji(emoji)}
                  sx={{
                    cursor: 'pointer',
                    px: 1,
                    py: 0.5,
                    backgroundColor: 'grey.100',
                    borderRadius: 1,
                    fontSize: '0.8rem',
                    '&:hover': {
                      backgroundColor: 'grey.200'
                    }
                  }}
                >
                  {emoji} {code}
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>

      {/* Editor */}
      <Box sx={{ backgroundColor: 'background.paper' }}>
        <EditorContent
          editor={editor}
          placeholder={placeholder}
        />
      </Box>
    </Paper>
  );
}