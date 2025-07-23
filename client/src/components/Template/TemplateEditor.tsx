import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  Typography,
  IconButton,
  Button,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Menu,
  MenuItem,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Delete,
  DragIndicator,
  MoreVert,
  TextFields,
  Assignment,
  Assessment,
  Forum,
  Save,
  Undo,
  Redo,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { TemplateSection } from '../../types/template';

interface TemplateEditorProps {
  sections: TemplateSection[];
  onChange: (sections: TemplateSection[]) => void;
  onSave?: () => void;
  autoSave?: boolean;
  readOnly?: boolean;
}

const sectionTypes = [
  { value: 'text', label: 'テキスト', icon: <TextFields /> },
  { value: 'activity', label: '活動', icon: <Assignment /> },
  { value: 'assessment', label: '評価', icon: <Assessment /> },
  { value: 'discussion', label: 'ディスカッション', icon: <Forum /> },
];

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  sections: initialSections,
  onChange,
  onSave,
  autoSave = false,
  readOnly = false,
}) => {
  const [sections, setSections] = useState<TemplateSection[]>(initialSections);
  const [history, setHistory] = useState<TemplateSection[][]>([initialSections]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date>(new Date());

  // セクションが変更されたときの処理
  useEffect(() => {
    onChange(sections);
    
    // 自動保存
    if (autoSave && !readOnly) {
      const timer = setTimeout(() => {
        handleSave();
      }, 2000); // 2秒後に保存
      
      return () => clearTimeout(timer);
    }
  }, [sections]);

  // 履歴を追加
  const addToHistory = (newSections: TemplateSection[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newSections);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // セクション追加
  const addSection = (type: string = 'text') => {
    const newSection: TemplateSection = {
      id: `section-${Date.now()}`,
      title: '',
      content: '',
      type: type as any,
      order: sections.length,
      duration: 10,
    };
    const newSections = [...sections, newSection];
    setSections(newSections);
    addToHistory(newSections);
  };

  // セクション更新
  const updateSection = (id: string, field: keyof TemplateSection, value: any) => {
    const newSections = sections.map(section =>
      section.id === id ? { ...section, [field]: value } : section
    );
    setSections(newSections);
    addToHistory(newSections);
  };

  // セクション削除
  const deleteSection = (id: string) => {
    const newSections = sections.filter(section => section.id !== id);
    setSections(newSections);
    addToHistory(newSections);
  };

  // セクション複製
  const duplicateSection = (id: string) => {
    const sectionToDuplicate = sections.find(s => s.id === id);
    if (!sectionToDuplicate) return;

    const newSection: TemplateSection = {
      ...sectionToDuplicate,
      id: `section-${Date.now()}`,
      title: `${sectionToDuplicate.title} (コピー)`,
    };

    const index = sections.findIndex(s => s.id === id);
    const newSections = [
      ...sections.slice(0, index + 1),
      newSection,
      ...sections.slice(index + 1),
    ];
    setSections(newSections);
    addToHistory(newSections);
  };

  // ドラッグ終了時の処理
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // order を更新
    const newSections = items.map((item, index) => ({
      ...item,
      order: index,
    }));

    setSections(newSections);
    addToHistory(newSections);
  };

  // 元に戻す
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setSections(history[historyIndex - 1]);
    }
  };

  // やり直す
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setSections(history[historyIndex + 1]);
    }
  };

  // 保存
  const handleSave = () => {
    onSave?.();
    setLastSaved(new Date());
  };

  // メニュー操作
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, sectionId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedSectionId(sectionId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSectionId(null);
  };

  const handleMenuAction = (action: 'duplicate' | 'delete' | 'changeType', type?: string) => {
    if (!selectedSectionId) return;

    switch (action) {
      case 'duplicate':
        duplicateSection(selectedSectionId);
        break;
      case 'delete':
        deleteSection(selectedSectionId);
        break;
      case 'changeType':
        if (type) {
          updateSection(selectedSectionId, 'type', type);
        }
        break;
    }
    handleMenuClose();
  };

  return (
    <Box>
      {/* ツールバー */}
      {!readOnly && (
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                startIcon={<Add />}
                onClick={() => addSection('text')}
                variant="outlined"
                size="small"
              >
                セクション追加
              </Button>
              <IconButton
                onClick={handleUndo}
                disabled={historyIndex === 0}
                size="small"
              >
                <Undo />
              </IconButton>
              <IconButton
                onClick={handleRedo}
                disabled={historyIndex === history.length - 1}
                size="small"
              >
                <Redo />
              </IconButton>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {autoSave && (
                <Typography variant="caption" color="text.secondary">
                  最終保存: {lastSaved.toLocaleTimeString()}
                </Typography>
              )}
              {onSave && (
                <Button
                  startIcon={<Save />}
                  onClick={handleSave}
                  variant="contained"
                  size="small"
                >
                  保存
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      )}

      {/* セクションリスト */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="sections">
          {(provided) => (
            <List {...provided.droppableProps} ref={provided.innerRef}>
              {sections.map((section, index) => (
                <Draggable
                  key={section.id}
                  draggableId={section.id}
                  index={index}
                  isDragDisabled={readOnly}
                >
                  {(provided, snapshot) => (
                    <ListItem
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      sx={{
                        mb: 2,
                        bgcolor: snapshot.isDragging ? 'action.hover' : 'background.paper',
                        borderRadius: 2,
                        boxShadow: snapshot.isDragging ? 4 : 1,
                      }}
                    >
                      <Paper
                        elevation={snapshot.isDragging ? 4 : 1}
                        sx={{ width: '100%', p: 3 }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                          {!readOnly && (
                            <Box
                              {...provided.dragHandleProps}
                              sx={{ mr: 2, cursor: 'grab' }}
                            >
                              <DragIndicator color="action" />
                            </Box>
                          )}
                          
                          <Box sx={{ flexGrow: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <Chip
                                icon={sectionTypes.find(t => t.value === section.type)?.icon}
                                label={sectionTypes.find(t => t.value === section.type)?.label}
                                size="small"
                                sx={{ mr: 1 }}
                              />
                              {section.duration && (
                                <Chip
                                  label={`${section.duration}分`}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                            
                            <TextField
                              fullWidth
                              label="セクションタイトル"
                              value={section.title}
                              onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                              disabled={readOnly}
                              sx={{ mb: 2 }}
                            />
                            
                            <TextField
                              fullWidth
                              label="内容"
                              value={section.content}
                              onChange={(e) => updateSection(section.id, 'content', e.target.value)}
                              multiline
                              rows={4}
                              disabled={readOnly}
                            />
                            
                            {section.type !== 'text' && !readOnly && (
                              <Box sx={{ mt: 2 }}>
                                <TextField
                                  label="所要時間（分）"
                                  type="number"
                                  value={section.duration || ''}
                                  onChange={(e) => updateSection(section.id, 'duration', parseInt(e.target.value))}
                                  size="small"
                                  sx={{ width: 120 }}
                                />
                              </Box>
                            )}
                          </Box>
                          
                          {!readOnly && (
                            <Box>
                              <IconButton
                                onClick={(e) => handleMenuOpen(e, section.id)}
                                size="small"
                              >
                                <MoreVert />
                              </IconButton>
                            </Box>
                          )}
                        </Box>
                      </Paper>
                    </ListItem>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </List>
          )}
        </Droppable>
      </DragDropContext>

      {/* セクションが空の場合 */}
      {sections.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            セクションがありません
          </Typography>
          {!readOnly && (
            <Button
              startIcon={<Add />}
              onClick={() => addSection('text')}
              variant="contained"
            >
              最初のセクションを追加
            </Button>
          )}
        </Paper>
      )}

      {/* コンテキストメニュー */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleMenuAction('duplicate')}>
          複製
        </MenuItem>
        <Divider />
        <MenuItem disabled>タイプ変更</MenuItem>
        {sectionTypes.map((type) => (
          <MenuItem
            key={type.value}
            onClick={() => handleMenuAction('changeType', type.value)}
            sx={{ pl: 4 }}
          >
            {type.icon}
            <Box sx={{ ml: 1 }}>{type.label}</Box>
          </MenuItem>
        ))}
        <Divider />
        <MenuItem
          onClick={() => handleMenuAction('delete')}
          sx={{ color: 'error.main' }}
        >
          削除
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default TemplateEditor;