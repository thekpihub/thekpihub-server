import { useRef, useCallback } from "react";
import Editor, { OnMount, OnChange } from "@monaco-editor/react";
import { useThemeStore } from "@/store";
import { getEffectiveTheme } from "@/lib/theme";

interface CodeEditorProps {
  value: string;
  language?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  minimap?: boolean;
  fontSize?: number;
  path?: string;
}

export default function CodeEditor({
  value,
  language = "typescript",
  onChange,
  readOnly = false,
  minimap = false,
  fontSize = 14,
  path,
}: CodeEditorProps) {
  const { theme } = useThemeStore();
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const effectiveTheme = getEffectiveTheme(theme);

  const handleMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;

    // Configure TypeScript
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: "React",
      allowJs: true,
      typeRoots: ["node_modules/@types"],
    });

    // Define Ditto dark theme
    monaco.editor.defineTheme("ditto-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "5c6370", fontStyle: "italic" },
        { token: "keyword", foreground: "c678dd" },
        { token: "string", foreground: "98c379" },
        { token: "number", foreground: "d19a66" },
        { token: "type", foreground: "e5c07b" },
        { token: "variable", foreground: "e06c75" },
        { token: "function", foreground: "61afef" },
      ],
      colors: {
        "editor.background": "#0d0f1a",
        "editor.foreground": "#abb2bf",
        "editor.lineHighlightBackground": "#1a1d2e",
        "editorLineNumber.foreground": "#3b4261",
        "editorLineNumber.activeForeground": "#6070ff",
        "editor.selectionBackground": "#3d4468",
        "editor.inactiveSelectionBackground": "#2c3060",
        "editorIndentGuide.background1": "#1f2340",
        "editorIndentGuide.activeBackground1": "#3d4468",
        "scrollbarSlider.background": "#1f2340cc",
        "scrollbarSlider.hoverBackground": "#3d4468cc",
        "scrollbarSlider.activeBackground": "#6070ff99",
      },
    });

    monaco.editor.defineTheme("ditto-light", {
      base: "vs",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#fafafa",
        "editorLineNumber.activeForeground": "#6070ff",
      },
    });

    monaco.editor.setTheme(effectiveTheme === "dark" ? "ditto-dark" : "ditto-light");

    // Format on save (Ctrl+S)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      editor.getAction("editor.action.formatDocument")?.run();
    });
  }, [effectiveTheme]);

  const handleChange: OnChange = useCallback(
    (val) => {
      if (onChange) onChange(val ?? "");
    },
    [onChange]
  );

  return (
    <Editor
      height="100%"
      defaultLanguage={language}
      language={language}
      value={value}
      path={path}
      theme={effectiveTheme === "dark" ? "ditto-dark" : "ditto-light"}
      onChange={handleChange}
      onMount={handleMount}
      options={{
        readOnly,
        minimap: { enabled: minimap },
        fontSize,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
        fontLigatures: true,
        lineNumbers: "on",
        renderWhitespace: "selection",
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        insertSpaces: true,
        wordWrap: "on",
        smoothScrolling: true,
        cursorSmoothCaretAnimation: "on",
        bracketPairColorization: { enabled: true },
        padding: { top: 12, bottom: 12 },
        contextmenu: true,
        suggest: {
          showKeywords: true,
          showSnippets: true,
        },
        quickSuggestions: true,
        formatOnPaste: true,
        formatOnType: false,
      }}
    />
  );
}
