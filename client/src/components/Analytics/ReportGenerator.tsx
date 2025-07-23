import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  TextField,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  Description,
  CalendarToday,
  FilterList,
  GetApp,
  NavigateNext,
  NavigateBefore,
} from '@mui/icons-material';
import DateRangePicker from './DateRangePicker';
import {
  AnalyticsTimeRange,
  AnalyticsFilter,
  REPORT_TYPES,
} from '../../types/analytics';
import {
  TEMPLATE_SUBJECTS,
  TEMPLATE_GRADE_LEVELS,
} from '../../types/template';
import analyticsService from '../../services/analytics';

interface ReportGeneratorProps {
  open: boolean;
  onClose: () => void;
  onGenerate?: (reportId: string) => void;
}

const steps = ['レポートタイプ', '期間設定', 'フィルター', '確認'];

const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  open,
  onClose,
  onGenerate,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // フォームデータ
  const [reportType, setReportType] = useState('summary');
  const [reportFormat, setReportFormat] = useState('pdf');
  const [reportTitle, setReportTitle] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date(),
    period: 'month',
  });
  const [filters, setFilters] = useState<AnalyticsFilter>({
    timeRange,
    userType: 'all',
    subject: [],
    gradeLevel: [],
    personalityType: [],
  });

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleGenerate();
    } else {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError('');
      
      const report = await analyticsService.generateReport(
        reportType,
        { ...filters, timeRange },
        reportFormat
      );
      
      // レポートをダウンロード
      const blob = await analyticsService.downloadReport(report.id);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportTitle || 'report'}_${new Date().toISOString()}.${reportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      onGenerate?.(report.id);
      handleClose();
    } catch (err) {
      setError('レポートの生成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setError('');
    onClose();
  };

  const getReportTypeInfo = () => {
    return REPORT_TYPES.find(t => t.value === reportType);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // レポートタイプ
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              生成するレポートの種類を選択してください
            </Typography>
            
            <RadioGroup
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              {REPORT_TYPES.map((type) => (
                <Box
                  key={type.value}
                  sx={{
                    mb: 2,
                    p: 2,
                    border: 1,
                    borderColor: reportType === type.value ? 'primary.main' : 'divider',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: 'primary.main',
                    },
                  }}
                  onClick={() => setReportType(type.value)}
                >
                  <FormControlLabel
                    value={type.value}
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="subtitle1">{type.label}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {type.description}
                        </Typography>
                      </Box>
                    }
                  />
                </Box>
              ))}
            </RadioGroup>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                出力形式
              </Typography>
              <RadioGroup
                row
                value={reportFormat}
                onChange={(e) => setReportFormat(e.target.value)}
              >
                <FormControlLabel value="pdf" control={<Radio />} label="PDF" />
                <FormControlLabel value="excel" control={<Radio />} label="Excel" />
                <FormControlLabel value="csv" control={<Radio />} label="CSV" />
              </RadioGroup>
            </Box>
          </Box>
        );
        
      case 1: // 期間設定
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              レポートに含めるデータの期間を設定してください
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <DateRangePicker
                value={timeRange}
                onChange={setTimeRange}
              />
            </Box>
            
            <TextField
              fullWidth
              label="レポートタイトル"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder={`${getReportTypeInfo()?.label} - ${new Date().toLocaleDateString()}`}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="レポートの説明（任意）"
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              placeholder="このレポートの目的や補足情報を入力してください"
            />
          </Box>
        );
        
      case 2: // フィルター
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              レポートに適用するフィルターを設定してください（任意）
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>ユーザータイプ</InputLabel>
              <Select
                value={filters.userType || 'all'}
                onChange={(e) => setFilters({ ...filters, userType: e.target.value as any })}
              >
                <MenuItem value="all">すべて</MenuItem>
                <MenuItem value="active">アクティブユーザー</MenuItem>
                <MenuItem value="new">新規ユーザー</MenuItem>
              </Select>
            </FormControl>
            
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
              教科（複数選択可）
            </Typography>
            <FormGroup row sx={{ mb: 2 }}>
              {TEMPLATE_SUBJECTS.slice(0, 5).map((subject) => (
                <FormControlLabel
                  key={subject.value}
                  control={
                    <Checkbox
                      checked={filters.subject?.includes(subject.value) || false}
                      onChange={(e) => {
                        const newSubjects = e.target.checked
                          ? [...(filters.subject || []), subject.value]
                          : filters.subject?.filter(s => s !== subject.value) || [];
                        setFilters({ ...filters, subject: newSubjects });
                      }}
                    />
                  }
                  label={subject.label}
                />
              ))}
            </FormGroup>
            
            <Typography variant="subtitle2" gutterBottom>
              学年（複数選択可）
            </Typography>
            <FormGroup row>
              {TEMPLATE_GRADE_LEVELS.slice(0, 4).map((grade) => (
                <FormControlLabel
                  key={grade.value}
                  control={
                    <Checkbox
                      checked={filters.gradeLevel?.includes(grade.value) || false}
                      onChange={(e) => {
                        const newGrades = e.target.checked
                          ? [...(filters.gradeLevel || []), grade.value]
                          : filters.gradeLevel?.filter(g => g !== grade.value) || [];
                        setFilters({ ...filters, gradeLevel: newGrades });
                      }}
                    />
                  }
                  label={grade.label}
                />
              ))}
            </FormGroup>
          </Box>
        );
        
      case 3: // 確認
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              以下の内容でレポートを生成します
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                レポートタイプ
              </Typography>
              <Typography variant="body1">
                {getReportTypeInfo()?.label}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                期間
              </Typography>
              <Typography variant="body1">
                {timeRange.startDate.toLocaleDateString()} 〜 {timeRange.endDate.toLocaleDateString()}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                出力形式
              </Typography>
              <Typography variant="body1">
                {reportFormat.toUpperCase()}
              </Typography>
            </Box>
            
            {reportTitle && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  タイトル
                </Typography>
                <Typography variant="body1">
                  {reportTitle}
                </Typography>
              </Box>
            )}
            
            {(filters.subject?.length || filters.gradeLevel?.length) > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  フィルター
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                  {filters.subject?.map(s => {
                    const subject = TEMPLATE_SUBJECTS.find(sub => sub.value === s);
                    return <Chip key={s} label={subject?.label || s} size="small" />;
                  })}
                  {filters.gradeLevel?.map(g => {
                    const grade = TEMPLATE_GRADE_LEVELS.find(gr => gr.value === g);
                    return <Chip key={g} label={grade?.label || g} size="small" />;
                  })}
                </Box>
              </Box>
            )}
          </Box>
        );
        
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Description />
          レポート生成
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {renderStepContent()}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>
          キャンセル
        </Button>
        <Button
          onClick={handleBack}
          disabled={activeStep === 0}
          startIcon={<NavigateBefore />}
        >
          戻る
        </Button>
        <Button
          onClick={handleNext}
          variant="contained"
          disabled={loading}
          endIcon={activeStep === steps.length - 1 ? <GetApp /> : <NavigateNext />}
        >
          {loading ? (
            <CircularProgress size={24} />
          ) : activeStep === steps.length - 1 ? (
            '生成'
          ) : (
            '次へ'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportGenerator;