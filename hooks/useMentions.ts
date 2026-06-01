import { useState } from "react";

interface MentionableMember {
    id: string;
    name: string;
    profilePictureUrl?: string;
}

interface UseMentionsProps {
    value: string;
    setValue: (v: string) => void;
    inputRef: React.RefObject<HTMLInputElement | null>;
    mirrorRef: React.RefObject<HTMLDivElement | null>;
    members: MentionableMember[];
}

export function useMentions({
    value,
    setValue,
    inputRef,
    mirrorRef,
    members,
}: UseMentionsProps) {
    const [query, setQuery] = useState("");
    const [showMentionList, setShowMentionList] = useState(false);
    const [mentionIndex, setMentionIndex] = useState(0);
    const [mentionPosition, setMentionPosition] = useState<{
        top: number;
        left: number;
        isAbove: boolean;
    } | null>(null);

    const filteredMembers = query
        ? members.filter((m) =>
            m.name.toLowerCase().includes(query.toLowerCase())
        )
        : members;

    const insertMention = (member: MentionableMember) => {
        if (!inputRef.current) return;

        const cursorPos = inputRef.current.selectionStart ?? value.length;
        const beforeCursor = value.slice(0, cursorPos);
        const afterCursor = value.slice(cursorPos);
        const atIndex = beforeCursor.lastIndexOf("@");
        if (atIndex === -1) return;

        const beforeAt = beforeCursor.slice(0, atIndex);
        const mentionText = `@${member.name} `;

        const newText = beforeAt + mentionText + afterCursor;
        setValue(newText);

        requestAnimationFrame(() => {
            if (inputRef.current) {
                const pos = beforeAt.length + mentionText.length;
                inputRef.current.selectionStart = pos;
                inputRef.current.selectionEnd = pos;
                inputRef.current.focus();
            }
        });

        setShowMentionList(false);
        setQuery("");
    };

    // const updateMentionPosition = (caretIndex: number) => {
    //     if (!inputRef.current || !mirrorRef.current) return;

    //     const input = inputRef.current;
    //     const mirror = mirrorRef.current;

    //     mirror.innerHTML = "";

    //     const textBeforeCaret = input.value.slice(0, caretIndex);

    //     const span = document.createElement("span");
    //     span.textContent = "\u200b"; // zero-width char

    //     mirror.textContent = textBeforeCaret;
    //     mirror.appendChild(span);

    //     const spanRect = span.getBoundingClientRect();
    //     const dropdownHeight = 185;
    //     // const spaceBelow = window.innerHeight - spanRect.bottom;

    //     const styles = window.getComputedStyle(input);
    //     const lineHeight = parseFloat(styles.lineHeight);
    //     const fontSize = parseFloat(styles.fontSize);

    //     // Approximate caret baseline
    //     const caretY = spanRect.bottom - (lineHeight - fontSize) / 2;

    //     const viewportHeight = window.innerHeight;

    //     const spaceAbove = caretY;
    //     const spaceBelow = viewportHeight - caretY;

    //     const GAP = 4; // small visual gap

    //     let top: number;

    //     if (spaceAbove >= dropdownHeight) {
    //         // ✅ enough space above → show above
    //         // top = caretY - dropdownHeight - GAP;
    //         top = caretY - 190
    //     } else {
    //         // ❌ not enough space above → show below
    //         top = caretY + 25;
    //     }

    //     setMentionPosition({
    //         left: spanRect.left,
    //         top,
    //     });


    //     // const lineHeight = parseFloat(
    //     //     window.getComputedStyle(input).lineHeight
    //     // );

    //     // setMentionPosition({
    //     //     left: spanRect.left,
    //     //     top:
    //     //         spaceBelow < dropdownHeight
    //     //             // ? spanRect.top - dropdownHeight - lineHeight / 2 // 👆 above
    //     //             ? spanRect.top - dropdownHeight - 1  // 👆 above
    //     //             : spanRect.bottom + 15,              // 👇 below
    //     // });
    // };

    const updateMentionPosition = (caretIndex: number) => {
        if (!inputRef.current || !mirrorRef.current) return;

        const input = inputRef.current;
        const mirror = mirrorRef.current;

        mirror.innerHTML = "";

        const textBeforeCaret = input.value.slice(0, caretIndex);

        const span = document.createElement("span");
        span.textContent = "\u200b"; // zero-width char

        mirror.textContent = textBeforeCaret;
        mirror.appendChild(span);

        const spanRect = span.getBoundingClientRect();

        const dropdownHeight = 256; // matches max-h-64 in ThreadCard.tsx
        const GAP = 12; // increased for better breathing room
        const horizontalBuffer = 8; // move list slightly right of the cursor

        // fallback to caret position with small buffer
        const caretX = spanRect.left + horizontalBuffer;

        // use spanRect.bottom as baseline for below, spanRect.top as baseline for above
        const spaceAbove = spanRect.top;
        const spaceBelow = window.innerHeight - spanRect.bottom;

        let top: number;
        let isAbove = false;

        if (spaceBelow >= dropdownHeight + GAP) {
            // enough space below → show below
            top = spanRect.bottom + GAP;
        } else if (spaceAbove >= dropdownHeight + GAP) {
            // enough space above → show above
            // IMPORTANT: top becomes the anchor point where the *bottom* of the list should be
            top = spanRect.top - GAP;
            isAbove = true;
        } else {
            // fallback → show below but may overflow
            top = Math.max(GAP, spanRect.bottom + GAP);
        }

        setMentionPosition({
            left: caretX,
            top,
            isAbove,
        });
    };  

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = inputRef.current;
        const mirror = mirrorRef.current;
        if (!input || !mirror) return;

        const text = e.target.value;
        setValue(text);

        const cursorPos = e.target.selectionStart ?? text.length;
        const textUpToCursor = text.slice(0, cursorPos);
        const atIndex = textUpToCursor.lastIndexOf("@");

        if (atIndex < 0) {
            setShowMentionList(false);
            setQuery("");
            setMentionPosition(null);
            return;
        }

        const charBefore = atIndex > 0 ? textUpToCursor[atIndex - 1] : " ";
        if (charBefore !== " " && charBefore !== "\n") {
            setShowMentionList(false);
            return;
        }

        const q = textUpToCursor.slice(atIndex + 1);
        if (/[\s.,!?]/.test(q)) {
            setShowMentionList(false);
            setQuery("");
            setMentionPosition(null);
            return;
        }

        setQuery(q);
        setShowMentionList(true);
        setMentionIndex(0);

        // ✅ Anchor to '@' position so the box doesn't move as the user types a name
        updateMentionPosition(atIndex);
    };


    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showMentionList || filteredMembers.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setMentionIndex((i) => Math.min(i + 1, filteredMembers.length - 1));
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            setMentionIndex((i) => Math.max(i - 1, 0));
        }

        if (e.key === "Enter") {
            e.preventDefault();
            insertMention(filteredMembers[mentionIndex]);
        }

        if (e.key === "Escape") {
            setShowMentionList(false);
            setQuery("");
        }
    };

    return {
        showMentionList,
        filteredMembers,
        mentionIndex,
        mentionPosition,
        onChange,
        onKeyDown,
        onSelectMember: insertMention,
        updateMentionPosition
    };
}
