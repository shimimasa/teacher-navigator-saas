import React, { useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Button,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  Print,
  Download,
  Close,
  School,
  AccessTime,
  Grade,
  CheckCircle,
  Build,
} from '@mui/icons-material';
import { Template, TEMPLATE_TYPES } from '../../types/template';
import templateService from '../../services/template';

interface TemplatePreviewProps {
  template: Template;
  onClose?: () => void;
  showActions?: boolean;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  template,
  onClose,
  showActions = true,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      const blob = await templateService.generatePDF(template.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('PDF生成に失敗しました', error);
    }
  };

  const typeInfo = TEMPLATE_TYPES[template.type];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ヘッダー */}
      {showActions && (
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              プレビュー
            </Typography>
            <Button
              startIcon={<Print />}
              onClick={handlePrint}
              sx={{ mr: 1 }}
            >
              印刷
            </Button>
            <Button
              startIcon={<Download />}
              onClick={handleDownloadPDF}
              sx={{ mr: 2 }}
            >
              PDF
            </Button>
            {onClose && (
              <IconButton onClick={onClose}>
                <Close />
              </IconButton>
            )}
          </Toolbar>
        </AppBar>
      )}

      {/* コンテンツ */}
      <Box
        ref={printRef}
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          bgcolor: 'grey.100',
          p: 3,
          '@media print': {
            bgcolor: 'white',
            p: 0,
          },
        }}
      >
        <Paper
          sx={{
            maxWidth: 800,
            mx: 'auto',
            p: 4,
            '@media print': {
              maxWidth: '100%',
              boxShadow: 'none',
              p: 2,
            },
          }}
        >
          {/* タイトル部分 */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Chip
                label={typeInfo.label}
                sx={{
                  backgroundColor: typeInfo.color,
                  color: 'white',
                }}
              />
              <Typography variant="h4" component="h1">
                {template.title}
              </Typography>
            </Box>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {template.description}
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <School fontSize="small" />
                <Typography variant="body2">
                  {template.subject}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Grade fontSize="small" />
                <Typography variant="body2">
                  {template.gradeLevel}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AccessTime fontSize="small" />
                <Typography variant="body2">
                  {template.duration}分
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* 学習目標 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              学習目標
            </Typography>
            <List>
              {template.objectives.map((objective, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckCircle color="primary" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={objective} />
                </ListItem>
              ))}
            </List>
          </Box>

          {/* 必要な教材 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              必要な教材
            </Typography>
            <List>
              {template.materials.map((material, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Build color="action" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={material} />
                </ListItem>
              ))}
            </List>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* 授業の流れ */}
          <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
            授業の流れ
          </Typography>

          {/* 導入 */}
          {template.content.introduction && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom color="primary">
                1. 導入（5-10分）
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {template.content.introduction}
                </Typography>
              </Paper>
            </Box>
          )}

          {/* 展開 */}
          {template.content.mainActivity && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom color="primary">
                2. 展開（30-35分）
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {template.content.mainActivity}
                </Typography>
              </Paper>
            </Box>
          )}

          {/* まとめ */}
          {template.content.conclusion && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom color="primary">
                3. まとめ（5-10分）
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {template.content.conclusion}
                </Typography>
              </Paper>
            </Box>
          )}

          {/* セクション形式の場合 */}
          {template.content.sections && template.content.sections.length > 0 && (
            <>
              {template.content.sections.map((section, index) => (
                <Box key={section.id} sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    {index + 1}. {section.title}
                    {section.duration && ` (${section.duration}分)`}
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {section.content}
                    </Typography>
                  </Paper>
                </Box>
              ))}
            </>
          )}

          {/* 宿題・課題 */}
          {template.content.homework && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                宿題・課題
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {template.content.homework}
                </Typography>
              </Paper>
            </Box>
          )}

          {/* 備考・注意点 */}
          {template.content.notes && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                備考・注意点
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'warning.light', color: 'warning.dark' }}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {template.content.notes}
                </Typography>
              </Paper>
            </Box>
          )}

          {/* タグ */}
          {template.tags.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                タグ:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {template.tags.map((tag, index) => (
                  <Chip key={index} label={tag} size="small" />
                ))}
              </Box>
            </Box>
          )}

          {/* フッター */}
          <Box sx={{ mt: 4, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  作成者: {template.userName || '匿名'}
                </Typography>
              </Grid>
              <Grid item xs={6} sx={{ textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary">
                  更新日: {new Date(template.updatedAt).toLocaleDateString()}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default TemplatePreview;