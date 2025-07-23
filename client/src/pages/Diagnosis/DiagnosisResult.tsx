import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
} from '@mui/material';
import {
  Print,
  Share,
  Refresh,
  Feedback,
  Download,
} from '@mui/icons-material';
import PersonalityTypeCard from '../../components/Diagnosis/PersonalityTypeCard';
import ScoreChart from '../../components/Diagnosis/ScoreChart';
import RecommendedStyles from '../../components/Diagnosis/RecommendedStyles';
import diagnosisService from '../../services/diagnosis';
import { DiagnosisResult as DiagnosisResultType } from '../../types/diagnosis';

const steps = ['診断完了', '結果分析', '授業スタイル提案'];

const DiagnosisResult: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<DiagnosisResultType | null>(null);
  const [reliability, setReliability] = useState<any>(null);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedback, setFeedback] = useState({
    rating: 0,
    comment: '',
  });

  useEffect(() => {
    if (id) {
      loadDiagnosisResult();
    }
  }, [id]);

  const loadDiagnosisResult = async () => {
    try {
      const data = await diagnosisService.getDiagnosisResult(id!);
      setResult(data.result);
      setReliability(data.reliability);
      setLoading(false);
    } catch (error: any) {
      setError('診断結果の読み込みに失敗しました');
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: '教員ナビゲーター診断結果',
        text: `私のパーソナリティタイプは${result?.personalityType}です`,
        url: window.location.href,
      });
    }
  };

  const handleRetakeDiagnosis = () => {
    navigate('/diagnosis');
  };

  const handleFeedbackSubmit = async () => {
    if (!id || feedback.rating === 0) return;

    try {
      await diagnosisService.submitFeedback(id, feedback.rating, feedback.comment);
      setShowFeedbackDialog(false);
      // 成功通知を表示（実装省略）
    } catch (error) {
      // エラー処理
    }
  };

  const handleStepClick = (step: number) => {
    setActiveStep(step);
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !result) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || '診断結果が見つかりません'}
          </Alert>
          <Button variant="contained" onClick={() => navigate('/diagnosis')}>
            診断ページへ戻る
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          診断結果
        </Typography>

        {/* 信頼性の警告 */}
        {reliability && !reliability.isReliable && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            回答の一貫性に問題がある可能性があります。より正確な結果を得るために、再度診断を受けることをお勧めします。
          </Alert>
        )}

        {/* ステッパー */}
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label, index) => (
              <Step key={label} onClick={() => handleStepClick(index)} sx={{ cursor: 'pointer' }}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* アクションボタン */}
        <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={handlePrint}
          >
            印刷
          </Button>
          <Button
            variant="outlined"
            startIcon={<Share />}
            onClick={handleShare}
            disabled={!navigator.share}
          >
            共有
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRetakeDiagnosis}
          >
            再診断
          </Button>
          <Button
            variant="outlined"
            startIcon={<Feedback />}
            onClick={() => setShowFeedbackDialog(true)}
          >
            フィードバック
          </Button>
        </Box>

        {/* コンテンツ表示 */}
        <Box sx={{ mb: 4 }}>
          {activeStep === 0 && (
            <PersonalityTypeCard result={result} />
          )}
          
          {activeStep === 1 && (
            <ScoreChart scores={result.scores} />
          )}
          
          {activeStep === 2 && result.recommendedStyles && (
            <RecommendedStyles
              styles={result.recommendedStyles}
              diagnosisId={id!}
            />
          )}
        </Box>

        {/* ナビゲーションボタン */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={() => setActiveStep(prev => prev - 1)}
          >
            前へ
          </Button>
          
          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={() => setActiveStep(prev => prev + 1)}
            >
              次へ
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={() => navigate('/templates')}
            >
              テンプレートを作成
            </Button>
          )}
        </Box>

        {/* フィードバックダイアログ */}
        <Dialog
          open={showFeedbackDialog}
          onClose={() => setShowFeedbackDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>診断へのフィードバック</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Typography component="legend" gutterBottom>
                診断の満足度を教えてください
              </Typography>
              <Rating
                value={feedback.rating}
                onChange={(_, value) => setFeedback({ ...feedback, rating: value || 0 })}
                size="large"
                sx={{ mb: 3 }}
              />
              
              <TextField
                fullWidth
                multiline
                rows={4}
                label="コメント（任意）"
                value={feedback.comment}
                onChange={(e) => setFeedback({ ...feedback, comment: e.target.value })}
                placeholder="診断の感想や改善点があればお聞かせください"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowFeedbackDialog(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleFeedbackSubmit}
              variant="contained"
              disabled={feedback.rating === 0}
            >
              送信
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default DiagnosisResult;