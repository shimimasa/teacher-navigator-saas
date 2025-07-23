import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  CircularProgress,
  Autocomplete,
  Dialog,
  DialogContent,
  AppBar,
  Toolbar,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Add,
  Remove,
  Save,
  Preview,
  ArrowBack,
  Close,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import templateService from '../../services/template';
import teachingStyleService from '../../services/teachingStyle';
import TemplateEditor from '../../components/Template/TemplateEditor';
import TemplatePreview from '../../components/Template/TemplatePreview';
import {
  Template,
  TemplateFormData,
  TemplateSection,
  TEMPLATE_TYPES,
  TEMPLATE_SUBJECTS,
  TEMPLATE_GRADE_LEVELS,
  POPULAR_TAGS,
} from '../../types/template';
import { TeachingStyle } from '../../types/teachingStyle';

const EditTemplate: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [originalTemplate, setOriginalTemplate] = useState<Template | null>(null);
  const [teachingStyles, setTeachingStyles] = useState<TeachingStyle[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [useAdvancedEditor, setUseAdvancedEditor] = useState(false);
  const [sections, setSections] = useState<TemplateSection[]>([]);
  
  const [formData, setFormData] = useState<TemplateFormData>({
    title: '',
    description: '',
    type: 'lesson_plan',
    teachingStyleId: '',
    subject: '',
    gradeLevel: '',
    duration: 50,
    objectives: [''],
    materials: [''],
    content: {
      introduction: '',
      mainActivity: '',
      conclusion: '',
      homework: '',
      notes: '',
    },
    tags: [],
    isPublic: false,
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // テンプレートデータを読み込む
      if (id) {
        const template = await templateService.getTemplateById(id);
        
        // 権限チェック
        if (template.userId !== user?.id) {
          setError('このテンプレートを編集する権限がありません');
          return;
        }
        
        setOriginalTemplate(template);
        setFormData({
          title: template.title,
          description: template.description,
          type: template.type,
          teachingStyleId: template.teachingStyleId,
          subject: template.subject,
          gradeLevel: template.gradeLevel,
          duration: template.duration,
          objectives: template.objectives.length > 0 ? template.objectives : [''],
          materials: template.materials.length > 0 ? template.materials : [''],
          content: template.content,
          tags: template.tags,
          isPublic: template.isPublic,
        });
        setSelectedTags(template.tags);
        
        // セクション形式の場合
        if (template.content.sections) {
          setSections(template.content.sections);
          setUseAdvancedEditor(true);
        }
      }
      
      // 授業スタイル一覧を読み込む
      const response = await teachingStyleService.getTeachingStyles(1, 100);
      setTeachingStyles(response.styles);
      
      setError('');
    } catch (err) {
      setError('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // バリデーション
    if (!formData.title || !formData.type || !formData.teachingStyleId) {
      setError('必須項目を入力してください');
      return;
    }

    try {
      setSaving(true);
      
      const dataToSubmit = {
        ...formData,
        tags: selectedTags,
        objectives: formData.objectives.filter(obj => obj.trim() !== ''),
        materials: formData.materials.filter(mat => mat.trim() !== ''),
        content: useAdvancedEditor
          ? { ...formData.content, sections }
          : formData.content,
      };
      
      const updatedTemplate = await templateService.updateTemplate(id!, dataToSubmit);
      
      // 元のテンプレートデータを更新
      setOriginalTemplate(updatedTemplate);
      setError('');
      
      // 成功メッセージを表示してから詳細ページへ
      setTimeout(() => {
        navigate(`/templates/${id}`);
      }, 1000);
    } catch (err) {
      setError('テンプレートの保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateContent = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [field]: value,
      },
    }));
  };

  const updateArrayField = (field: 'objectives' | 'materials', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item),
    }));
  };

  const addArrayField = (field: 'objectives' | 'materials') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ''],
    }));
  };

  const removeArrayField = (field: 'objectives' | 'materials', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const getPreviewTemplate = (): Template => {
    return {
      ...originalTemplate!,
      ...formData,
      content: useAdvancedEditor
        ? { ...formData.content, sections }
        : formData.content,
      tags: selectedTags,
    };
  };

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error && !originalTemplate) {
    return (
      <Container>
        <Box sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button variant="contained" onClick={() => navigate('/templates')}>
            テンプレート一覧へ戻る
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/templates/${id}`)}
          sx={{ mb: 3 }}
        >
          詳細に戻る
        </Button>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            テンプレート編集
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Preview />}
              onClick={() => setShowPreview(true)}
            >
              プレビュー
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} /> : <Save />}
              onClick={handleSave}
              disabled={saving}
            >
              保存
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {saving && (
          <Alert severity="info" sx={{ mb: 3 }}>
            保存中...
          </Alert>
        )}

        <Paper elevation={2} sx={{ p: 4 }}>
          <Grid container spacing={3}>
            {/* 基本情報 */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                基本情報
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="タイトル"
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="説明"
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>テンプレートタイプ</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => updateFormData('type', e.target.value)}
                >
                  {Object.entries(TEMPLATE_TYPES).map(([key, value]) => (
                    <MenuItem key={key} value={key}>
                      {value.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>授業スタイル</InputLabel>
                <Select
                  value={formData.teachingStyleId}
                  onChange={(e) => updateFormData('teachingStyleId', e.target.value)}
                >
                  {teachingStyles.map((style) => (
                    <MenuItem key={style.id} value={style.id}>
                      {style.displayName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>公開設定</InputLabel>
                <Select
                  value={formData.isPublic ? 'public' : 'private'}
                  onChange={(e) => updateFormData('isPublic', e.target.value === 'public')}
                >
                  <MenuItem value="private">非公開</MenuItem>
                  <MenuItem value="public">公開</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* 詳細情報 */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                詳細情報
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>教科</InputLabel>
                <Select
                  value={formData.subject}
                  onChange={(e) => updateFormData('subject', e.target.value)}
                >
                  {TEMPLATE_SUBJECTS.map((subject) => (
                    <MenuItem key={subject.value} value={subject.value}>
                      {subject.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>学年</InputLabel>
                <Select
                  value={formData.gradeLevel}
                  onChange={(e) => updateFormData('gradeLevel', e.target.value)}
                >
                  {TEMPLATE_GRADE_LEVELS.map((grade) => (
                    <MenuItem key={grade.value} value={grade.value}>
                      {grade.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="授業時間（分）"
                value={formData.duration}
                onChange={(e) => updateFormData('duration', parseInt(e.target.value))}
              />
            </Grid>

            {/* 学習目標 */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                学習目標
              </Typography>
              <List>
                {formData.objectives.map((objective, index) => (
                  <ListItem key={index}>
                    <ListItemText>
                      <TextField
                        fullWidth
                        value={objective}
                        onChange={(e) => updateArrayField('objectives', index, e.target.value)}
                        placeholder={`目標 ${index + 1}`}
                        size="small"
                      />
                    </ListItemText>
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => removeArrayField('objectives', index)}
                        disabled={formData.objectives.length === 1}
                      >
                        <Remove />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
              <Button
                startIcon={<Add />}
                onClick={() => addArrayField('objectives')}
                size="small"
              >
                目標を追加
              </Button>
            </Grid>

            {/* 必要な教材 */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                必要な教材
              </Typography>
              <List>
                {formData.materials.map((material, index) => (
                  <ListItem key={index}>
                    <ListItemText>
                      <TextField
                        fullWidth
                        value={material}
                        onChange={(e) => updateArrayField('materials', index, e.target.value)}
                        placeholder={`教材 ${index + 1}`}
                        size="small"
                      />
                    </ListItemText>
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => removeArrayField('materials', index)}
                        disabled={formData.materials.length === 1}
                      >
                        <Remove />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
              <Button
                startIcon={<Add />}
                onClick={() => addArrayField('materials')}
                size="small"
              >
                教材を追加
              </Button>
            </Grid>

            {/* タグ */}
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={POPULAR_TAGS}
                value={selectedTags}
                onChange={(_, value) => setSelectedTags(value)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="タグ"
                    placeholder="タグを選択または入力"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      {...getTagProps({ index })}
                    />
                  ))
                }
                freeSolo
              />
            </Grid>

            {/* 内容編集 */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  内容編集
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={useAdvancedEditor}
                      onChange={(e) => setUseAdvancedEditor(e.target.checked)}
                    />
                  }
                  label="高度なエディタを使用"
                />
              </Box>
            </Grid>

            {useAdvancedEditor ? (
              <Grid item xs={12}>
                <TemplateEditor
                  sections={sections}
                  onChange={setSections}
                  onSave={handleSave}
                  autoSave={false}
                />
              </Grid>
            ) : (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="導入"
                    value={formData.content.introduction}
                    onChange={(e) => updateContent('introduction', e.target.value)}
                    multiline
                    rows={4}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="展開"
                    value={formData.content.mainActivity}
                    onChange={(e) => updateContent('mainActivity', e.target.value)}
                    multiline
                    rows={6}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="まとめ"
                    value={formData.content.conclusion}
                    onChange={(e) => updateContent('conclusion', e.target.value)}
                    multiline
                    rows={4}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="宿題・課題"
                    value={formData.content.homework}
                    onChange={(e) => updateContent('homework', e.target.value)}
                    multiline
                    rows={3}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="備考・注意点"
                    value={formData.content.notes}
                    onChange={(e) => updateContent('notes', e.target.value)}
                    multiline
                    rows={3}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </Paper>

        {/* プレビューダイアログ */}
        <Dialog
          fullScreen
          open={showPreview}
          onClose={() => setShowPreview(false)}
        >
          <AppBar sx={{ position: 'relative' }}>
            <Toolbar>
              <IconButton
                edge="start"
                color="inherit"
                onClick={() => setShowPreview(false)}
                aria-label="close"
              >
                <Close />
              </IconButton>
              <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                プレビュー
              </Typography>
            </Toolbar>
          </AppBar>
          <TemplatePreview
            template={getPreviewTemplate()}
            showActions={false}
          />
        </Dialog>
      </Box>
    </Container>
  );
};

export default EditTemplate;