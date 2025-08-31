"use client";

import { useState, useMemo } from 'react';
import { useFileSearch } from '@/hooks/use-git';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  Search,
  FileText,
  ChevronDown,
  ChevronRight,
  Replace,
  MoreHorizontal,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchResult {
  file: string;
  matches: {
    line: number;
    column: number;
    text: string;
    preview: string;
  }[];
}

// Remove mock data - now using real search functionality

export function SearchView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [includePattern, setIncludePattern] = useState('');
  const [excludePattern, setExcludePattern] = useState('');
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  // Use real search functionality
  const { searchResults, isLoading, error, searchFiles, clearSearch } = useFileSearch();

  // Trigger search when query or options change
  const performSearch = () => {
    if (!searchQuery.trim()) {
      clearSearch();
      return;
    }

    searchFiles(searchQuery, {
      caseSensitive,
      wholeWord,
      useRegex,
      includePattern: includePattern || undefined,
      excludePattern: excludePattern || undefined
    });
  };

  const totalMatches = useMemo(() => {
    return searchResults.reduce((total, result) => total + result.matches.length, 0);
  }, [searchResults]);

  const toggleFileExpansion = (file: string) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(file)) {
      newExpanded.delete(file);
    } else {
      newExpanded.add(file);
    }
    setExpandedFiles(newExpanded);
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, caseSensitive ? 'g' : 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search input */}
      <div className="p-3 border-b border-border space-y-3">
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Input 
              placeholder="搜索..." 
              className="h-8 pl-7 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && performSearch()}
            />
          </div>

          {showReplace && (
            <div className="relative">
              <Replace className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <Input 
                placeholder="替换..." 
                className="h-8 pl-7 text-sm"
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Search options */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowReplace(!showReplace)}
              title="切换替换"
            >
              <Replace className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              title="更多选项"
            >
              <MoreHorizontal className="w-3 h-3" />
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant={caseSensitive ? "default" : "ghost"}
              size="icon"
              className="h-6 w-6 text-xs font-mono"
              onClick={() => setCaseSensitive(!caseSensitive)}
              title="区分大小写"
            >
              Aa
            </Button>
            <Button
              variant={wholeWord ? "default" : "ghost"}
              size="icon"
              className="h-6 w-6 text-xs"
              onClick={() => setWholeWord(!wholeWord)}
              title="全词匹配"
            >
              ab
            </Button>
            <Button
              variant={useRegex ? "default" : "ghost"}
              size="icon"
              className="h-6 w-6 text-xs"
              onClick={() => setUseRegex(!useRegex)}
              title="使用正则表达式"
            >
              .*
            </Button>
          </div>
        </div>

        {/* File patterns */}
        <div className="space-y-2">
          <Input 
            placeholder="要包含的文件 (例如: *.tsx, *.ts)" 
            className="h-7 text-xs"
            value={includePattern}
            onChange={(e) => setIncludePattern(e.target.value)}
          />
          <Input 
            placeholder="要排除的文件 (例如: node_modules)" 
            className="h-7 text-xs"
            value={excludePattern}
            onChange={(e) => setExcludePattern(e.target.value)}
          />
        </div>

        {/* Search button */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-6 text-xs px-2 flex-1"
            onClick={performSearch}
            disabled={!searchQuery.trim() || isLoading}
          >
            {isLoading ? '搜索中...' : '搜索'}
          </Button>
          {searchQuery && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-xs px-2"
              onClick={() => {
                setSearchQuery('');
                clearSearch();
              }}
            >
              清除
            </Button>
          )}
        </div>

        {/* Replace actions */}
        {showReplace && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-6 text-xs px-2 flex-1">
              替换
            </Button>
            <Button variant="outline" size="sm" className="h-6 text-xs px-2 flex-1">
              全部替换
            </Button>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto">
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Search className="w-12 h-12 mb-4 opacity-50 animate-pulse" />
            <p className="text-sm">正在搜索...</p>
          </div>
        )}

        {error && (
          <div className="p-3 border-b border-border">
            <div className="text-sm text-destructive">{error}</div>
          </div>
        )}

        {!isLoading && searchQuery && (
          <div className="p-3 border-b border-border">
            <div className="text-sm text-muted-foreground">
              {searchResults.length > 0 ? (
                <>在 {searchResults.length} 个文件中找到 {totalMatches} 个结果</>
              ) : (
                <>没有找到结果</>
              )}
            </div>
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="p-3 space-y-2">
            {searchResults.map((result, index) => {
              const isExpanded = expandedFiles.has(result.file);
              
              return (
                <div key={index} className="space-y-1">
                  <div 
                    className="flex items-center gap-2 p-2 hover:bg-accent rounded-md cursor-pointer text-sm group"
                    onClick={() => toggleFileExpansion(result.file)}
                  >
                    {isExpanded ? 
                      <ChevronDown className="w-4 h-4 text-muted-foreground" /> : 
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    }
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span className="flex-1 font-mono text-xs">{result.file}</span>
                    <Badge variant="outline" className="h-4 text-xs px-1">
                      {result.matches.length}
                    </Badge>
                  </div>

                  {isExpanded && (
                    <div className="ml-6 space-y-1">
                      {result.matches.map((match, matchIndex) => (
                        <div 
                          key={matchIndex}
                          className="flex items-start gap-2 p-2 hover:bg-accent/50 rounded text-xs cursor-pointer"
                        >
                          <span className="text-muted-foreground w-8 text-right shrink-0">
                            {match.line}
                          </span>
                          <code className="flex-1 font-mono">
                            {highlightMatch(match.preview, searchQuery)}
                          </code>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!searchQuery && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Search className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm">输入搜索内容开始查找</p>
            <p className="text-xs mt-2 text-center max-w-xs">
              支持正则表达式、大小写敏感匹配，可设置包含/排除文件模式
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
