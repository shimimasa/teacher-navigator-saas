import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import { PlayArrow, ExitToApp } from '@mui/icons-material';
import QuestionCard from '../../components/Diagnosis/QuestionCard';
import ProgressIndicator from '../../components/Diagnosis/ProgressIndicator';
import diagnosisService from '../../services/diagnosis';
import { DiagnosisQuestion, DiagnosisAnswer, DiagnosisSession } from '../../types/diagnosis';

const DiagnosisWizard: React.FC = () => {
  const navigate = useNavigate();
  
  // 状態管理
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [questions, setQuestions] = useState<DiagnosisQuestion[]>([]);
  const [session, setSession] = useState<DiagnosisSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [error, setError] = useState('');
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showStartDialog, setShowStartDialog] = useState(true);

  // 初期化
  useEffect(() => {
    loadQuestions();
  }, []);

  // 質問の読み込み
  const loadQuestions = async () => {
    try {
      const data = await diagnosisService.getQuestions();
      setQuestions(data);
      setLoading(false);
    } catch (error: any) {
      setError('質問の読み込みに失敗しました');
      setLoading(false);
    }
  };

  // 診断開始
  const startDiagnosis = async () => {
    setShowStartDialog(false);
    setLoading(true);
    
    try {
      const newSession = await diagnosisService.startDiagnosis();
      setSession(newSession);
      
      // 既存の回答を復元
      if (newSession.answers.length > 0) {
        const restoredAnswers: Record<string, number> = {};
        newSession.answers.forEach(answer => {
          restoredAnswers[answer.questionId] = answer.value;
        });
        setAnswers(restoredAnswers);
        
        // 最後に回答した質問の次から開始
        const lastAnsweredIndex = questions.findIndex(
          q => q.id === newSession.answers[newSession.answers.length - 1].questionId
        );
        if (lastAnsweredIndex !== -1 && lastAnsweredIndex < questions.length - 1) {
          setCurrentQuestionIndex(lastAnsweredIndex + 1);
        }
      }
      
      setLoading(false);
    } catch (error: any) {
      setError('診断の開始に失敗しました');
      setLoading(false);
    }
  };

  // 回答の保存
  const saveAnswer = async (questionId: string, value: number) => {
    if (!session) return;
    
    setSaving(true);
    setError('');
    
    try {
      await diagnosisService.saveAnswer(session._id, questionId, value);
      setAnswers(prev => ({ ...prev, [questionId]: value }));
    } catch (error: any) {
      setError('回答の保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  // 次の質問へ
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // 最後の質問の場合は完了処理
      handleComplete();
    }
  };

  // 前の質問へ
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // 診断完了
  const handleComplete = async () => {
    if (!session) return;
    
    setLoading(true);
    
    try {
      const result = await diagnosisService.submitDiagnosis(session._id);
      // 結果ページへ遷移
      navigate(`/diagnosis/result/${result.diagnosisId}`);
    } catch (error: any) {
      setError(error.response?.data?.error?.message || '診断の完了に失敗しました');
      setLoading(false);
    }
  };

  // 診断終了
  const handleExit = () => {
    navigate('/');
  };

  // カテゴリー別進捗の計算
  const calculateCategoryProgress = () => {
    const progress = {
      extroversion: 0,
      sensing: 0,
      thinking: 0,
      judging: 0,
    };
    
    questions.forEach(question => {
      if (answers[question.id]) {
        progress[question.category]++;
      }
    });
    
    return progress;
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const categoryProgress = calculateCategoryProgress();

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          パーソナリティ診断
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {session && currentQuestion && (
          <>
            <ProgressIndicator
              currentQuestion={currentQuestionIndex + 1}
              totalQuestions={questions.length}
              answeredQuestions={answeredCount}
              categoryProgress={categoryProgress}
            />

            <QuestionCard
              question={currentQuestion}
              currentAnswer={answers[currentQuestion.id]}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={questions.length}
              onAnswer={(value) => saveAnswer(currentQuestion.id, value)}
              onNext={handleNext}
              onPrevious={handlePrevious}
              isFirst={currentQuestionIndex === 0}
              isLast={currentQuestionIndex === questions.length - 1}
            />

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<ExitToApp />}
                onClick={() => setShowExitDialog(true)}
              >
                診断を中断
              </Button>
            </Box>

            {saving && (
              <Box sx={{ position: 'fixed', bottom: 20, right: 20 }}>
                <Paper elevation={3} sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  <Typography variant="body2">保存中...</Typography>
                </Paper>
              </Box>
            )}
          </>
        )}

        {/* 診断開始ダイアログ */}
        <Dialog open={showStartDialog && !session} maxWidth="sm" fullWidth>
          <DialogTitle>パーソナリティ診断を開始</DialogTitle>
          <DialogContent>
            <DialogContentText>
              これから40問の質問に答えていただきます。
              各質問について、あなたの普段の行動や考え方に最も近いものを選んでください。
              回答は自動的に保存されるので、途中で中断しても後から再開できます。
            </DialogContentText>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                • 所要時間: 約15-20分
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 質問数: 40問
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 正解・不正解はありません
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => navigate('/')}>キャンセル</Button>
            <Button
              onClick={startDiagnosis}
              variant="contained"
              startIcon={<PlayArrow />}
            >
              診断を開始
            </Button>
          </DialogActions>
        </Dialog>

        {/* 診断終了確認ダイアログ */}
        <Dialog open={showExitDialog} onClose={() => setShowExitDialog(false)}>
          <DialogTitle>診断を中断しますか？</DialogTitle>
          <DialogContent>
            <DialogContentText>
              現在までの回答は保存されています。
              後から診断を再開することができます。
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowExitDialog(false)}>診断を続ける</Button>
            <Button onClick={handleExit} color="error">
              中断する
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default DiagnosisWizard;