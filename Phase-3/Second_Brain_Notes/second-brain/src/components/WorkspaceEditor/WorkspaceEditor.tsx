import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Link } from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { CharacterCount } from '@tiptap/extension-character-count';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import { openUrl } from '@tauri-apps/plugin-opener';

// Custom Link extension: renders data-href instead of href so Tauri's OS-level
// link interceptor (triggered by real href attributes) never fires.
const SafeLink = Link.extend({
  renderHTML({ HTMLAttributes }) {
    const { href, ...rest } = HTMLAttributes;
    return ['a', { ...rest, 'data-href': href, class: 'safe-link' }, 0];
  },
});


let openUrlCallCount = 0;
const safeOpenUrl = (url: string) => {
  openUrlCallCount++;
  console.log('openUrl called! Count:', openUrlCallCount, 'URL:', url);
  if (openUrlCallCount > 1) {
    console.log('Preventing duplicate openUrl within the same session!');
    // Reset after a short delay
    setTimeout(() => { openUrlCallCount = 0; }, 500);
    return Promise.resolve();
  }
  setTimeout(() => { openUrlCallCount = 0; }, 500);
  return openUrl(url);
};


import Toolbar from '../Toolbar/Toolbar';
import EditorArea from '../EditorArea/EditorArea';
import LinkModeEditor from './LinkModeEditor';
import type { EditorRef } from '../../hooks/useTabs';
import type { ContentType } from '../../types';

interface WorkspaceEditorProps {
  // Document state
  body: string;
  url?: string;
  onChange: () => void;
  onUrlChange?: (url: string) => void;
  hasActiveTab: boolean;
  isLoading: boolean;
  zoom: number;
  onCursorChange: (line: number, col: number, charCount: number) => void;
  
  // Toolbar state
  suggestedType?: ContentType;
  onTypeChange?: (type: ContentType) => void;
  tags?: string[];
  tagSuggestions?: string[];
  onTagsChange?: (tags: string[]) => void;
  onSaveToVault?: () => void;
  onSettingsClick: () => void;
  onNewTab?: () => void;
  onCloseTab?: () => void;
}

function formatUrl(href: string): string {
  href = href.trim();
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(href)) {
    return href;
  }
  if (href.includes('.') && !href.includes(' ')) {
    return 'https://' + href;
  }
  return 'https://www.google.com/search?q=' + encodeURIComponent(href);
}

const WorkspaceEditor = forwardRef<EditorRef, WorkspaceEditorProps>(
  function WorkspaceEditor({
    body,
    url,
    onChange,
    onUrlChange,
    hasActiveTab,
    isLoading,
    zoom,
    onCursorChange,
    suggestedType,
    onTypeChange,
    tags,
    tagSuggestions,
    onTagsChange,
    onSaveToVault,
    onSettingsClick,
    onNewTab,
    onCloseTab,
  }, ref) {

    const editor = useEditor({
      extensions: [
        StarterKit,
        SafeLink.configure({ openOnClick: false }),
        Table.configure({ resizable: false }),
        TableRow,
        TableHeader,
        TableCell,
        CharacterCount,
        Placeholder.configure({ placeholder: 'Start typing…' }),
        Markdown,
      ],
      content: body, // initial content parsed from markdown
      onUpdate: () => {
        onChange();
      },
      editorProps: {
        handleClick(_view, _pos, event) {
          const target = event.target as HTMLElement;
          const link = target.closest('a');
          if (link) {
            // ALWAYS prevent default webview navigation for any click on a link
            event.preventDefault();
            
            if (event.ctrlKey) {
              event.stopPropagation();
              let href = link.getAttribute('data-href') || link.getAttribute('href');
              if (href) safeOpenUrl(formatUrl(href)).catch(console.error);
              return true; // Stop ProseMirror processing
            }
            // If plain click: let ProseMirror handle cursor placement
            return false;
          }
          return false;
        },
      },
      onSelectionUpdate: ({ editor }) => {
        const { from } = editor.state.selection;
        const resolvedPos = editor.state.doc.resolve(from);
        
        const line = resolvedPos.index(0) + 1;
        const col = resolvedPos.parentOffset + 1;
        
        const chars = editor.storage.characterCount.characters();
        onCursorChange(line, col, chars);
      },
    });

    const lastBodyRef = useRef(body);
    const prevTypeRef = useRef<ContentType | undefined>(suggestedType);

    useEffect(() => {
      const prev = prevTypeRef.current;
      const curr = suggestedType;
      prevTypeRef.current = curr;
      if (!editor || prev === curr || prev === undefined) return;

      if (curr === 'codeSnippet') {
        // Use native TipTap commands instead of parsing markdown manually,
        // which guarantees a proper <pre><code> block is created regardless of markdown parsing quirks.
        editor.chain().selectAll().setCodeBlock().run();
        // Prevent the body-sync useEffect from immediately erasing this change
        lastBodyRef.current = body;
      }

      if (prev === 'link' && curr === 'note') {
        const urlToInsert = url?.trim() ?? '';
        if (urlToInsert) {
          editor.chain()
            .focus('end')
            .insertContent(`\n\n[${urlToInsert}](${urlToInsert})`)
            .run();
          // Prevent the body-sync useEffect from immediately erasing this change
          lastBodyRef.current = body;
        }
        onUrlChange?.('');
      }
    }, [suggestedType, editor, url, onUrlChange]);

    useEffect(() => {
      if (!editor) return;
      if (suggestedType === 'link') return; // body not displayed in link mode
      // CHANGE 27: Performance polish - avoid expensive getMarkdown() on every tab switch
      if (lastBodyRef.current !== body) {
        lastBodyRef.current = body;
        editor.commands.setContent(body);
      }
    }, [body, editor, suggestedType]);

    useImperativeHandle(ref, () => ({
      getMarkdown: () => {
        if (!editor) return '';
        const md = (editor.storage as any).markdown.getMarkdown();
        lastBodyRef.current = md; // Sync ref so React state updates don't trigger setContent
        return md;
      },
      getCursorState: () => {
        if (!editor) return { selectionStart: 0, selectionEnd: 0, scrollTop: 0, scrollLeft: 0 };
        const { from, to } = editor.state.selection;
        const scrollContainer = document.querySelector('.editor-area');
        return {
          selectionStart: from,
          selectionEnd: to,
          scrollTop: scrollContainer?.scrollTop || 0,
          scrollLeft: scrollContainer?.scrollLeft || 0,
        };
      },
      setCursorState: ({ selectionStart, selectionEnd, scrollTop, scrollLeft }) => {
        if (!editor) return;
        
        const docSize = editor.state.doc.content.size;
        const safeStart = Math.min(Math.max(0, selectionStart), docSize);
        const safeEnd = Math.min(Math.max(0, selectionEnd), docSize);
        
        editor.commands.setTextSelection({ from: safeStart, to: safeEnd });
        
        const scrollContainer = document.querySelector('.editor-area');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollTop;
          scrollContainer.scrollLeft = scrollLeft;
        }
      },
      focus: () => {
        editor?.commands.focus();
      }
    }), [editor]);

    return (
      <>
        <Toolbar 
          editor={suggestedType === 'link' ? null : editor}
          suggestedType={suggestedType}
          onTypeChange={onTypeChange}
          isLinkMode={suggestedType === 'link'}
          isCodeMode={suggestedType === 'codeSnippet'}
          tags={tags}
          tagSuggestions={tagSuggestions}
          onTagsChange={onTagsChange}
          onSaveToVault={onSaveToVault}
          onSettingsClick={onSettingsClick}
          onNewTab={onNewTab}
          onCloseTab={onCloseTab}
        />
        {suggestedType === 'link' ? (
          <LinkModeEditor
            url={url ?? ''}
            onChange={onUrlChange ?? (() => {})}
            zoom={zoom}
          />
        ) : (
          <EditorArea 
            editor={editor}
            hasActiveTab={hasActiveTab}
            isLoading={isLoading}
            zoom={zoom}
          />
        )}
      </>
    );
  }
);

export default WorkspaceEditor;
