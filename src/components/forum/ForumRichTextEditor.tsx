'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import { useEffect } from 'react';
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
  EmojiEmotions,
  Image as ImageIcon
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
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Upload image function
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'forum'); // Required by the upload endpoint
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Feil ved opplasting av bilde');
    }
    
    const data = await response.json();
    return data.url;
  };

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
      Underline,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded',
        },
        allowBase64: false,
      })
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

  // Update editor content when prop changes (e.g., after form submission)
  useEffect(() => {
    if (editor && content === '' && editor.getHTML() !== '<p></p>') {
      editor.commands.clearContent();
    }
  }, [content, editor]);

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

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Kun bildefiler er tillatt');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Bildet er for stort. Maksimal størrelse er 5MB');
      return;
    }

    try {
      const imageUrl = await uploadImage(file);
      // Insert image at current cursor position without replacing content
      editor
        .chain()
        .focus()
        .insertContent(`<img src="${imageUrl}" class="max-w-full h-auto rounded" />`)
        .run();
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('Feil ved opplasting av bilde. Prøv igjen.');
    }

    // Reset file input
    event.target.value = '';
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

          <Tooltip title="Last opp bilde" placement="top">
            <IconButton
              size="small"
              onClick={handleImageUpload}
            >
              <ImageIcon fontSize="small" />
            </IconButton>
          </Tooltip>

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
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </Box>
    </Paper>
  );
}