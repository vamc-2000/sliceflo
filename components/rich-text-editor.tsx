"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import {TextStyle} from "@tiptap/extension-text-style";
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Strikethrough, RemoveFormatting } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FontSize } from '@tiptap/extension-text-style';

interface RichTextEditorProps {
  value?: string
  onChange?: (content: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({
  value = "",
  onChange,
  placeholder,
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TextStyle,
      FontSize,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: `tiptap p-3 text-sm text-foreground focus:outline-none prose max-w-full break-all overflow-hidden ${className ?? "min-h-[120px]"}`,
        "data-placeholder": placeholder ?? "",
      },
    },
    onUpdate({ editor }) {
      onChange?.(editor.getHTML());
    },
  });

  // Sync external value → editor (important!)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-md border border-input bg-background">
      <EditorContent editor={editor} />

      <div className="flex items-center gap-1 p-1 border-t border-border bg-muted/30">
        <Button size="icon" variant="ghost" onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <Underline className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => editor.chain().focus().setTextAlign("right").run()}>
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => editor.chain().focus().unsetAllMarks().run()}>
          <RemoveFormatting className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
























// "use client";

// import * as React from "react";
// import { useEditor, EditorContent } from "@tiptap/react";
// import StarterKit from "@tiptap/starter-kit";
// import Underline from "@tiptap/extension-underline";
// import Highlight from "@tiptap/extension-highlight";
// import TextAlign from "@tiptap/extension-text-align";
// import Superscript from "@tiptap/extension-superscript";
// import SubScript from "@tiptap/extension-subscript";
// import { TextStyle } from "@tiptap/extension-text-style";
// import { FontFamily } from "@tiptap/extension-font-family";
// import { FontSize } from "@tiptap/extension-font-size";

// import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
// import {
//   Bold,
//   Strikethrough,
//   Italic,
//   Underline as UnderlineIcon,
//   Heading1,
//   Heading2,
//   Heading3,
//   Heading4,
//   Link as LinkIcon,
//   Quote,
//   List,
//   ListOrdered,
//   RemoveFormattingIcon,
//   Unlink,
//   AlignLeft,
//   AlignCenter,
//   AlignRight,
//   AlignJustify,
//   Code,
//   Highlighter,
//   Subscript,
//   Superscript as SuperscriptIcon,
//   Minus,
//   Undo,
//   Redo,
//   AtSign,
//   FileImage,
//   Paperclip,
//   Sparkles,
// } from "lucide-react";
// import Link from "@tiptap/extension-link";
// import { cn } from "@/lib/utils";
// import Placeholder from "@tiptap/extension-placeholder";
// import "./rich-text-editor.css";
// import { Button } from "./ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu"
// import { ChevronDown, Type } from "lucide-react"


// interface RichTextEditorProps {
//   value?: string;
//   placeholder?: string;
//   onChange?: (content: string) => void;
//   className?: string;
// }

// export function RichTextEditor({
//   value = "",
//   onChange,
//   placeholder = "",
//   className,
// }: RichTextEditorProps) {
//   const editor = useEditor({
//     immediatelyRender: false,
//     extensions: [
//       StarterKit.configure({
//         heading: {
//           levels: [1, 2, 3, 4],
//         },
//       }),
//       TextStyle,      // Add this
//       FontFamily,     // Add this
//       FontSize,       // Add this
//       Underline,
//       Highlight,
//       Link,
//       TextAlign.configure({
//         types: ["heading", "paragraph"],
//         alignments: ["left", "center", "right", "justify"],
//       }),
//       Superscript,
//       SubScript,
//       Placeholder.configure({ placeholder }),
//     ],
//     content: value,
//     onUpdate: ({ editor }) => {
//       onChange?.(editor.getHTML());
//     },
//     editorProps: {
//       attributes: {
//         class: cn(
//           "block border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive field-sizing-content min-h-65 w-full rounded-xl border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none  md:text-sm",
//           "prose prose-sm sm:prose-base max-w-full"
//         ),
//       },
//     },
//   });

//   const handleAISpark = () => {
//     if (editor) {
//       const aiText = "✨ AI-generated content...";
//       editor.chain().focus().insertContent(aiText).run();
//     }
//   };
//   const handleFile = () => {
//     const input = document.createElement("input");
//     input.type = "file";
//     input.accept = "image/*,.pdf,.doc,.docx";
//     input.onchange = (e: Event) => {
//       const file = (e.target as HTMLInputElement).files?.[0];
//       if (file && editor) {
//         const reader = new FileReader();
//         reader.onload = (event) => {
//           const url = event.target?.result as string;
//           if (file.type.startsWith("image/")) {
//             editor
//               .chain()
//               .focus()
//               .insertContent(`<img src="${url}" alt="${file.name}" />`)
//               .run();
//           } else {
//             editor
//               .chain()
//               .focus()
//               .insertContent(`<a href="${url}">${file.name}</a>`)
//               .run();
//           }
//         };
//         reader.readAsDataURL(file);
//       }
//     };
//     input.click();
//   };
//   const handleMention = () => {
//     if (editor) {
//       const mention = window.prompt("Enter username to mention:");
//       if (mention) {
//         editor.chain().focus().insertContent(`@${mention} `).run();
//       }
//     }
//   };
//   const handleGIF = () => {
//     const gifUrl = window.prompt("Enter GIF URL:");
//     if (gifUrl && editor) {
//       editor
//         .chain()
//         .focus()
//         .insertContent(`<img src="${gifUrl}" alt="GIF" />`)
//         .run();
//     }
//   };


//   if (!editor) {
//     return null;
//   }

//   return (
//     <div className={cn("flex flex-col", className)}>
//       <div className="sticky top-0 z-10 bg-background pb-1 mb-0">
//         <div className="flex flex-wrap h-10 items-center gap-1 mb-2">
//           {/* Block Type Dropdown - REPLACES first ToggleGroup */}
//           {/* <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button variant="outline" size="sm" className="h-8 gap-1 min-w-[140px] justify-between">
//                 <span className="text-sm">
//                   {editor.isActive("heading", { level: 1 }) ? "Heading 1" :
//                     editor.isActive("heading", { level: 2 }) ? "Heading 2" :
//                       editor.isActive("heading", { level: 3 }) ? "Heading 3" :
//                         editor.isActive("heading", { level: 4 }) ? "Heading 4" :
//                           editor.isActive("bulletList") ? "Bulleted List" :
//                             editor.isActive("orderedList") ? "Numbered List" :
//                               "Paragraph"}
//                 </span>
//                 <ChevronDown className="h-4 w-4 opacity-50" />
//               </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent align="start" className="w-[200px]">
//               <DropdownMenuItem
//                 onClick={() => editor.chain().focus().setParagraph().run()}
//                 className="flex items-center gap-2"
//               >
//                 <Type className="h-4 w-4" />
//                 <span>Paragraph</span>
//               </DropdownMenuItem>
//               <DropdownMenuItem
//                 onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
//                 className="flex items-center gap-2"
//               >
//                 <Heading1 className="h-4 w-4" />
//                 <span>Heading 1</span>
//               </DropdownMenuItem>
//               <DropdownMenuItem
//                 onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
//                 className="flex items-center gap-2"
//               >
//                 <Heading2 className="h-4 w-4" />
//                 <span>Heading 2</span>
//               </DropdownMenuItem>
//               <DropdownMenuItem
//                 onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
//                 className="flex items-center gap-2"
//               >
//                 <Heading3 className="h-4 w-4" />
//                 <span>Heading 3</span>
//               </DropdownMenuItem>
//               <DropdownMenuItem
//                 onClick={() => editor.chain().focus().toggleBulletList().run()}
//                 className="flex items-center gap-2"
//               >
//                 <List className="h-4 w-4" />
//                 <span>Bulleted List</span>
//               </DropdownMenuItem>
//               <DropdownMenuItem
//                 onClick={() => editor.chain().focus().toggleOrderedList().run()}
//                 className="flex items-center gap-2"
//               >
//                 <ListOrdered className="h-4 w-4" />
//                 <span>Numbered List</span>
//               </DropdownMenuItem>
//             </DropdownMenuContent>
//           </DropdownMenu> */}

//           {/* ADD FONT CONTROLS HERE */}
//           {/* <select
//             className="border rounded px-2 py-1 text-sm h-8"
//             value={editor.getAttributes('textStyle').fontFamily || 'Arial'}
//             onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
//           >
//             <option value="Arial">Arial</option>
//             <option value="Times New Roman">Times New Roman</option>
//             <option value="Courier New">Courier New</option>
//             <option value="Georgia">Georgia</option>
//             <option value="Verdana">Verdana</option>
//           </select>

//           <select
//             className="border rounded px-4 py-1 text-sm h-8 ml-1"
//             value={editor.getAttributes('textStyle').fontSize || '16px'}
//             onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()}
//           >
//             <option value="12px">12</option>
//             <option value="14px">14</option>
//             <option value="16px">16</option>
//             <option value="18px">18</option>
//             <option value="20px">20</option>
//             <option value="24px">24</option>
//           </select> */}
//           <ToggleGroup type="multiple" size="sm" variant="outline">
//             <ToggleGroupItem
//               value="bold"
//               aria-label="Toggle bold"
//               onClick={() => editor.chain().focus().toggleBold().run()}
//               disabled={!editor.can().chain().focus().toggleBold().run()}
//               data-state={editor.isActive("bold") ? "on" : "off"}
//             >
//               <Bold className="size-4" />
//             </ToggleGroupItem>
//             <ToggleGroupItem
//               value="strike"
//               aria-label="Toggle strikethrough"
//               onClick={() => editor.chain().focus().toggleStrike().run()}
//               disabled={!editor.can().chain().focus().toggleStrike().run()}
//               data-state={editor.isActive("strike") ? "on" : "off"}
//             >
//               <Strikethrough className="size-4" />
//             </ToggleGroupItem>
//             <ToggleGroupItem
//               value="italic"
//               aria-label="Toggle italic"
//               onClick={() => editor.chain().focus().toggleItalic().run()}
//               disabled={!editor.can().chain().focus().toggleItalic().run()}
//               data-state={editor.isActive("italic") ? "on" : "off"}
//             >
//               <Italic className="size-4" />
//             </ToggleGroupItem>
//             <ToggleGroupItem
//               value="underline"
//               aria-label="Toggle underline"
//               onClick={() => editor.chain().focus().toggleUnderline().run()}
//               disabled={!editor.can().chain().focus().toggleUnderline().run()}
//               data-state={editor.isActive("underline") ? "on" : "off"}
//             >
//               <UnderlineIcon className="size-4" />
//             </ToggleGroupItem>
//             <ToggleGroupItem
//               value="code"
//               aria-label="Toggle code"
//               onClick={() => editor.chain().focus().toggleCode().run()}
//               disabled={!editor.can().chain().focus().toggleCode().run()}
//               data-state={editor.isActive("code") ? "on" : "off"}
//             >
//               <Code className="size-4" />
//             </ToggleGroupItem>
//             <ToggleGroupItem
//               value="highlight"
//               aria-label="Toggle highlight"
//               onClick={() => editor.chain().focus().toggleHighlight().run()}
//               disabled={!editor.can().chain().focus().toggleHighlight().run()}
//               data-state={editor.isActive("highlight") ? "on" : "off"}
//             >
//               <Highlighter className="size-4" />
//             </ToggleGroupItem>
//             <ToggleGroupItem
//               value="clear"
//               aria-label="Clear formatting"
//               onClick={() =>
//                 editor.chain().focus().clearNodes().unsetAllMarks().run()
//               }
//               disabled={
//                 !editor.can().chain().focus().clearNodes().unsetAllMarks().run()
//               }
//               data-state="off"
//             >
//               <RemoveFormattingIcon className="size-4" />
//             </ToggleGroupItem>
//           </ToggleGroup>

//           {/* <ToggleGroup type="single" size="sm" variant="outline">
//             <ToggleGroupItem
//               value="h1"
//               aria-label="Heading 1"
//               onClick={() =>
//                 editor.chain().focus().toggleHeading({ level: 1 }).run()
//               }
//               disabled={
//                 !editor.can().chain().focus().toggleHeading({ level: 1 }).run()
//               }
//               data-state={editor.isActive("heading", { level: 1 }) ? "on" : "off"}
//             >
//               <Heading1 className="size-4" />
//             </ToggleGroupItem>
//             <ToggleGroupItem
//               value="h2"
//               aria-label="Heading 2"
//               onClick={() =>
//                 editor.chain().focus().toggleHeading({ level: 2 }).run()
//               }
//               disabled={
//                 !editor.can().chain().focus().toggleHeading({ level: 2 }).run()
//               }
//               data-state={editor.isActive("heading", { level: 2 }) ? "on" : "off"}
//             >
//               <Heading2 className="size-4" />
//             </ToggleGroupItem>
//             <ToggleGroupItem
//               value="h3"
//               aria-label="Heading 3"
//               onClick={() =>
//                 editor.chain().focus().toggleHeading({ level: 3 }).run()
//               }
//               disabled={
//                 !editor.can().chain().focus().toggleHeading({ level: 3 }).run()
//               }
//               data-state={editor.isActive("heading", { level: 3 }) ? "on" : "off"}
//             >
//               <Heading3 className="size-4" />
//             </ToggleGroupItem>
//             <ToggleGroupItem
//               value="h4"
//               aria-label="Heading 4"
//               onClick={() =>
//                 editor.chain().focus().toggleHeading({ level: 4 }).run()
//               }
//               disabled={
//                 !editor.can().chain().focus().toggleHeading({ level: 4 }).run()
//               }
//               data-state={editor.isActive("heading", { level: 4 }) ? "on" : "off"}
//             >
//               <Heading4 className="size-4" />
//             </ToggleGroupItem>
//           </ToggleGroup>

//           <ToggleGroup type="multiple" size="sm" variant="outline">
//             <ToggleGroupItem
//               value="blockquote"
//               aria-label="Toggle blockquote"
//               onClick={() => editor.chain().focus().toggleBlockquote().run()}
//               disabled={!editor.can().chain().focus().toggleBlockquote().run()}
//               data-state={editor.isActive("blockquote") ? "on" : "off"}
//             >
//               <Quote className="size-4" />
//             </ToggleGroupItem>
//             <ToggleGroupItem
//               value="bulletList"
//               aria-label="Toggle bullet list"
//               onClick={() => editor.chain().focus().toggleBulletList().run()}
//               disabled={!editor.can().chain().focus().toggleBulletList().run()}
//               data-state={editor.isActive("bulletList") ? "on" : "off"}
//             >
//               <List className="size-4" />
//             </ToggleGroupItem>
//             <ToggleGroupItem
//               value="orderedList"
//               aria-label="Toggle ordered list"
//               onClick={() => editor.chain().focus().toggleOrderedList().run()}
//               disabled={!editor.can().chain().focus().toggleOrderedList().run()}
//               data-state={editor.isActive("orderedList") ? "on" : "off"}
//             >
//               <ListOrdered className="size-4" />
//             </ToggleGroupItem>
//             <ToggleGroupItem
//               value="horizontalRule"
//               aria-label="Add horizontal rule"
//               onClick={() => editor.chain().focus().setHorizontalRule().run()}
//               disabled={!editor.can().chain().focus().setHorizontalRule().run()}
//               data-state="off"
//             >
//               <Minus className="size-4" />
//             </ToggleGroupItem>
//             <ToggleGroupItem
//               value="superscript"
//               aria-label="Toggle superscript"
//               onClick={() => editor.chain().focus().toggleSuperscript().run()}
//               disabled={!editor.can().chain().focus().toggleSuperscript().run()}
//               data-state={editor.isActive("superscript") ? "on" : "off"}
//             >
//               <SuperscriptIcon className="size-4" />
//             </ToggleGroupItem>
//             <ToggleGroupItem
//               value="subscript"
//               aria-label="Toggle subscript"
//               onClick={() => editor.chain().focus().toggleSubscript().run()}
//               disabled={!editor.can().chain().focus().toggleSubscript().run()}
//               data-state={editor.isActive("subscript") ? "on" : "off"}
//             >
//               <Subscript className="size-4" />
//             </ToggleGroupItem>
//           </ToggleGroup>

//           <ToggleGroup type="single" size="sm" variant="outline">
//             <ToggleGroupItem
//               value="link"
//               aria-label="Add link"
//               onClick={() => {
//                 const url = window.prompt("Enter URL");
//                 if (url) {
//                   editor
//                     .chain()
//                     .focus()
//                     .setLink({
//                       href: url,
//                       target: "_blank",
//                       rel: "noopener noreferrer",
//                     })
//                     .run();
//                 }
//               }}
//               disabled={
//                 !editor
//                   .can()
//                   .chain()
//                   .focus()
//                   .setLink({ href: "https://example.com" })
//                   .run()
//               }
//               data-state={editor.isActive("link") ? "on" : "off"}
//             >
//               <LinkIcon className="size-4" />
//             </ToggleGroupItem>
//             <ToggleGroupItem
//               value="link"
//               aria-label="Add link"
//               onClick={() => {
//                 editor.chain().focus().unsetLink().run();
//               }}
//               disabled={!editor.can().chain().focus().unsetLink().run()}
//             >
//               <Unlink className="size-4" />
//             </ToggleGroupItem>
//           </ToggleGroup> */}

//           <ToggleGroup type="single" size="sm" variant="outline">
//             <ToggleGroupItem
//               value="left"
//               aria-label="Align left"
//               onClick={() => editor.chain().focus().setTextAlign("left").run()}
//               disabled={!editor.can().chain().focus().setTextAlign("left").run()}
//               data-state={editor.isActive({ textAlign: "left" }) ? "on" : "off"}
//             >
//               <AlignLeft className="size-4" />
//             </ToggleGroupItem>
//             <ToggleGroupItem
//               value="center"
//               aria-label="Align center"
//               onClick={() => editor.chain().focus().setTextAlign("center").run()}
//               disabled={
//                 !editor.can().chain().focus().setTextAlign("center").run()
//               }
//               data-state={editor.isActive({ textAlign: "center" }) ? "on" : "off"}
//             >
//               <AlignCenter className="size-4" />
//             </ToggleGroupItem>
//             <ToggleGroupItem
//               value="right"
//               aria-label="Align right"
//               onClick={() => editor.chain().focus().setTextAlign("right").run()}
//               disabled={!editor.can().chain().focus().setTextAlign("right").run()}
//               data-state={editor.isActive({ textAlign: "right" }) ? "on" : "off"}
//             >
//               <AlignRight className="size-4" />
//             </ToggleGroupItem>
//             <ToggleGroupItem
//               value="justify"
//               aria-label="Align justify"
//               onClick={() => editor.chain().focus().setTextAlign("justify").run()}
//               disabled={
//                 !editor.can().chain().focus().setTextAlign("justify").run()
//               }
//               data-state={
//                 editor.isActive({ textAlign: "justify" }) ? "on" : "off"
//               }
//             >
//               <AlignJustify className="size-4" />
//             </ToggleGroupItem>
//           </ToggleGroup>

//           <ToggleGroup type="single" size="sm" variant="outline">
//             <ToggleGroupItem
//               value="undo"
//               aria-label="Undo"
//               onClick={() => editor.chain().focus().undo().run()}
//               disabled={!editor.can().chain().focus().undo().run()}
//             >
//               <Undo className="size-4" />
//             </ToggleGroupItem>
//             <ToggleGroupItem
//               value="redo"
//               aria-label="Redo"
//               onClick={() => editor.chain().focus().redo().run()}
//               disabled={!editor.can().chain().focus().redo().run()}
//             >
//               <Redo className="size-4" />
//             </ToggleGroupItem>
//           </ToggleGroup>

//           {/* custome section */}
//           <Button
//             variant="ghost"
//             size="sm"
//             onClick={handleMention}
//             className="h-8 gap-1"
//           >
//             <AtSign className="h-4 w-4" />
//             <span className="text-xs">Mention</span>
//           </Button>

//           <Button
//             variant="ghost"
//             size="sm"
//             onClick={handleGIF}
//             className="h-8 gap-1"
//           >
//             <FileImage className="h-4 w-4" />
//             <span className="text-xs">GIF</span>
//           </Button>

//           <Button
//             variant="ghost"
//             size="sm"
//             onClick={handleAISpark}
//             className="h-8"
//             title="AI Assistant"
//           >
//             <Sparkles className="h-4 w-4 text-violet-600" />
//           </Button>

//           <Button
//             variant="ghost"
//             size="sm"
//             onClick={handleFile}
//             className="h-8"
//             title="Attach file"
//           >
//             <Paperclip className="h-4 w-4" />
//           </Button>
//         </div>
//       </div>


//       {/* Scrollable Editor Content */}
//       <div className="overflow-y-auto max-h-[260px] min-h-[150px]">
//         <EditorContent editor={editor} />
//       </div>
//     </div>
//   );
// }
