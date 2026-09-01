import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, ChevronDown, File, Folder, FolderOpen,
  Plus, Trash2, FilePlus, MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { ProjectFile } from "@/types";

function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();
  const colors: Record<string, string> = {
    ts: "text-blue-400",
    tsx: "text-cyan-400",
    js: "text-yellow-400",
    jsx: "text-yellow-400",
    py: "text-green-400",
    css: "text-pink-400",
    html: "text-orange-400",
    json: "text-amber-400",
    md: "text-gray-400",
    sql: "text-purple-400",
  };
  return colors[ext ?? ""] ?? "text-muted-foreground";
}

interface FileNodeProps {
  file: ProjectFile;
  depth?: number;
  activeFileId: string | null;
  onSelect: (file: ProjectFile) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

function FileNode({ file, depth = 0, activeFileId, onSelect, onDelete, onRename }: FileNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(file.name);

  const isActive = activeFileId === file.id;
  const indent = depth * 12;

  const handleRename = () => {
    if (newName.trim() && newName !== file.name) {
      onRename(file.id, newName.trim());
    }
    setRenaming(false);
  };

  if (file.isDirectory) {
    return (
      <div>
        <div
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer hover:bg-accent transition-colors group text-sm`}
          style={{ paddingLeft: `${8 + indent}px` }}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          )}
          {expanded ? (
            <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span className="truncate flex-1 text-muted-foreground group-hover:text-foreground">{file.name}</span>
        </div>
        <AnimatePresence>
          {expanded && file.children && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {file.children.map((child) => (
                <FileNode
                  key={child.id}
                  file={child}
                  depth={depth + 1}
                  activeFileId={activeFileId}
                  onSelect={onSelect}
                  onDelete={onDelete}
                  onRename={onRename}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer transition-colors group text-sm ${
        isActive ? "bg-ditto-500/15 text-foreground" : "hover:bg-accent text-muted-foreground hover:text-foreground"
      }`}
      style={{ paddingLeft: `${8 + indent}px` }}
      onClick={() => !renaming && onSelect(file)}
    >
      <File className={`w-4 h-4 shrink-0 ${getFileIcon(file.name)}`} />
      {renaming ? (
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onBlur={handleRename}
          onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setRenaming(false); }}
          className="h-5 text-xs px-1 py-0"
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="truncate flex-1 font-mono text-xs">{file.name}</span>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button
            size="icon-sm"
            variant="ghost"
            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          >
            <MoreHorizontal className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setRenaming(true)}>Rename</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive" onClick={() => onDelete(file.id)}>
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface FileTreeProps {
  files: ProjectFile[];
  activeFileId: string | null;
  onSelectFile: (file: ProjectFile) => void;
  onAddFile: (name: string) => void;
  onDeleteFile: (id: string) => void;
  onRenameFile: (id: string, name: string) => void;
}

export default function FileTree({ files, activeFileId, onSelectFile, onAddFile, onDeleteFile, onRenameFile }: FileTreeProps) {
  const [adding, setAdding] = useState(false);
  const [newFileName, setNewFileName] = useState("");

  const handleAddFile = () => {
    if (newFileName.trim()) {
      onAddFile(newFileName.trim());
      setNewFileName("");
    }
    setAdding(false);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 shrink-0">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Files</span>
        <div className="flex gap-1">
          <Button size="icon-sm" variant="ghost" className="h-6 w-6" onClick={() => setAdding(true)}>
            <FilePlus className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {adding && (
          <div className="px-2 py-1">
            <Input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onBlur={handleAddFile}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddFile(); if (e.key === "Escape") setAdding(false); }}
              placeholder="filename.ts"
              className="h-6 text-xs font-mono"
              autoFocus
            />
          </div>
        )}

        {files.length === 0 && !adding ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
            <File className="w-8 h-8 opacity-30" />
            <p className="text-xs">No files yet</p>
            <Button size="sm" variant="ghost" onClick={() => setAdding(true)} className="text-xs">
              <Plus className="w-3 h-3" /> New file
            </Button>
          </div>
        ) : (
          files.map((file) => (
            <FileNode
              key={file.id}
              file={file}
              activeFileId={activeFileId}
              onSelect={onSelectFile}
              onDelete={onDeleteFile}
              onRename={onRenameFile}
            />
          ))
        )}
      </div>
    </div>
  );
}
