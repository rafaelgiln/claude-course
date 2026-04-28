"use client";

import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { useFileSystem } from "@/lib/contexts/file-system-context";
import { Code2, Copy, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CodeEditor() {
  const { selectedFile, getFileContent, updateFile } = useFileSystem();
  const editorRef = useRef<any>(null);
  const [copied, setCopied] = useState(false);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const handleEditorChange = (value: string | undefined) => {
    if (selectedFile && value !== undefined) {
      updateFile(selectedFile, value);
    }
  };

  const getLanguageFromPath = (path: string): string => {
    const extension = path.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'json':
        return 'json';
      case 'css':
        return 'css';
      case 'html':
        return 'html';
      case 'md':
        return 'markdown';
      default:
        return 'plaintext';
    }
  };

  const handleCopy = async () => {
    const content = selectedFile ? getFileContent(selectedFile) || '' : '';
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!selectedFile) return;
    const content = getFileContent(selectedFile) || '';
    const filename = selectedFile.split('/').pop() || 'file.txt';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!selectedFile) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Code2 className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            Select a file to edit
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Choose a file from the file tree
          </p>
        </div>
      </div>
    );
  }

  const content = getFileContent(selectedFile) || '';
  const language = getLanguageFromPath(selectedFile);
  const filename = selectedFile.split('/').pop() || selectedFile;

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700/60 bg-gray-900">
        <span className="text-xs text-gray-400 font-mono truncate">{filename}</span>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700"
            onClick={handleCopy}
            title="Copy code"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span className="ml-1.5 text-xs">{copied ? "Copied!" : "Copy"}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700"
            onClick={handleDownload}
            title="Download file"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="ml-1.5 text-xs">Download</span>
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={language}
          value={content}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false,
            automaticLayout: true,
            wordWrap: 'on',
            padding: { top: 16, bottom: 16 },
          }}
        />
      </div>
    </div>
  );
}
