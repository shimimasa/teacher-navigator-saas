import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import {
  Add,
  Remove,
  Save,
  Preview,
  ArrowBack,
  ArrowForward,
  School,
  AccessTime,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import templateService from '../../services/template';
import teachingStyleService from '../../services/teachingStyle';
import {
  TemplateFormData,
  TEMPLATE_TYPES,
  TEMPLATE_SUBJECTS,
  TEMPLATE_GRADE_LEVELS,
  POPULAR_TAGS,
} from '../../types/template';
import { TeachingStyle } from '../../types/teachingStyle';

const steps = ['基本情報', '内容作成', '詳細設定'];

const CreateTemplate: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [teachingStyles, setTeachingStyles] = useState<TeachingStyle[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
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

  // URLパラメータから初期値を設定
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const styleId = params.get('styleId');
    const diagnosisId = params.get('diagnosisId');

    if (styleId) {
      setFormData(prev => ({ ...prev, teachingStyleId: styleId }));
    }

    // 診断結果からテンプレート生成
    if (diagnosisId && styleId) {
      generateFromDiagnosis(diagnosisId, styleId);
    }

    // 授業スタイル一覧を読み込む
    loadTeachingStyles();
  }, [location.search]);

  const loadTeachingStyles = async () => {
    try {
      const response = await teachingStyleService.getTeachingStyles(1, 100);
      setTeachingStyles(response.styles);
    } catch (err) {
      console.error('授業スタイルの読み込みに失敗しました', err);
    }
  };

  const generateFromDiagnosis = async (diagnosisId: string, styleId: string) => {
    try {
      setLoading(true);
      const template = await templateService.generateFromDiagnosis(
        diagnosisId,
        styleId,
        'lesson_plan'
      );
      
      // 生成されたテンプレートのデータをフォームに設定
      setFormData({
        title: template.title,
        description: template.description,
        type: template.type,
        teachingStyleId: template.teachingStyleId,
        subject: template.subject,
        gradeLevel: template.gradeLevel,
        duration: template.duration,
        objectives: template.objectives,
        materials: template.materials,
        content: template.content,
        tags: template.tags,
        isPublic: false,
      });
    } catch (err) {
      setError('テンプレートの生成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        if (!formData.title || !formData.type || !formData.teachingStyleId) {
          setError('必須項目を入力してください');
          return false;
        }
        break;
      case 1:
        if (!formData.content.introduction || !formData.content.mainActivity || !formData.content.conclusion) {
          setError('授業の流れを入力してください');
          return false;
        }
        break;
      case 2:
        if (!formData.subject || !formData.gradeLevel || formData.objectives.length === 0) {
          setError('詳細情報を入力してください');
          return false;
        }
        break;
    }
    setError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    try {
      setLoading(true);
      const dataToSubmit = {
        ...formData,
        tags: selectedTags,
        objectives: formData.objectives.filter(obj => obj.trim() !== ''),
        materials: formData.materials.filter(mat => mat.trim() !== ''),
      };
      
      const template = await templateService.createTemplate(dataToSubmit);
      navigate(`/templates/${template.id}`);
    } catch (err) {
      setError('テンプレートの作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    // プレビュー機能（別ウィンドウまたはモーダルで表示）
    console.log('プレビュー', formData);
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

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/templates')}
          sx={{ mb: 3 }}
        >
          テンプレート一覧に戻る
        </Button>

        <Typography variant="h4" component="h1" gutterBottom>
          テンプレート作成
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Paper elevation={2} sx={{ p: 4 }}>
          {/* ステップ1: 基本情報 */}
          {activeStep === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="タイトル"
                  value={formData.title}
                  onChange={(e) => updateFormData('title', e.target.value)}
                  required
                  helperText="例：二次関数の導入授業"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="説明"
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  multiline
                  rows={3}
                  helperText="このテンプレートの概要を説明してください"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>テンプレートタイプ</InputLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => updateFormData('type', e.target.value)}
                  >
                    {Object.entries(TEMPLATE_TYPES).map(([key, value]) => (
                      <MenuItem key={key} value={key}>
                        {value.label} - {value.description}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
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
            </Grid>
          )}

          {/* ステップ2: 内容作成 */}
          {activeStep === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  授業の流れ
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="導入"
                  value={formData.content.introduction}
                  onChange={(e) => updateContent('introduction', e.target.value)}
                  multiline
                  rows={4}
                  required
                  helperText="授業の導入部分（5-10分）"
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
                  helperText="メインの活動内容（30-35分）"
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
                  helperText="授業のまとめと振り返り（5-10分）"
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
                  helperText="家庭学習の内容（任意）"
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
                  helperText="指導上の注意点など（任意）"
                />
              </Grid>
            </Grid>
          )}

          {/* ステップ3: 詳細設定 */}
          {activeStep === 2 && (
            <Grid container spacing={3}>
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
                  InputProps={{
                    endAdornment: '分',
                  }}
                />
              </Grid>

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

              <Grid item xs={12}>
                <FormControl>
                  <InputLabel>公開設定</InputLabel>
                  <Select
                    value={formData.isPublic ? 'public' : 'private'}
                    onChange={(e) => updateFormData('isPublic', e.target.value === 'public')}
                  >
                    <MenuItem value="private">非公開（自分のみ）</MenuItem>
                    <MenuItem value="public">公開（他の教員と共有）</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}

          {/* ナビゲーションボタン */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
            >
              戻る
            </Button>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              {activeStep === steps.length - 1 && (
                <Button
                  variant="outlined"
                  startIcon={<Preview />}
                  onClick={handlePreview}
                >
                  プレビュー
                </Button>
              )}
              
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                >
                  作成
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ArrowForward />}
                >
                  次へ
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default CreateTemplate;