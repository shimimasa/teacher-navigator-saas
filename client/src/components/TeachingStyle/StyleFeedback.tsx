import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Rating,
  TextField,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Person,
  ThumbUp,
  Send,
  Star,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

interface Feedback {
  id: string;
  userId: string;
  userName: string;
  effectiveness: number;
  satisfaction: number;
  comment: string;
  date: Date;
  helpful: number;
}

interface StyleFeedbackProps {
  styleId: string;
  feedbacks: Feedback[];
  onSubmit: (effectiveness: number, satisfaction: number, comment: string) => Promise<void>;
  canSubmit: boolean;
}

const StyleFeedback: React.FC<StyleFeedbackProps> = ({
  styleId,
  feedbacks,
  onSubmit,
  canSubmit,
}) => {
  const [effectiveness, setEffectiveness] = useState(0);
  const [satisfaction, setSatisfaction] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (effectiveness === 0 || satisfaction === 0) {
      setError('評価を入力してください');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await onSubmit(effectiveness, satisfaction, comment);
      
      // リセット
      setEffectiveness(0);
      setSatisfaction(0);
      setComment('');
      setSuccess(true);
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('フィードバックの送信に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const averageEffectiveness = feedbacks.length > 0
    ? feedbacks.reduce((sum, f) => sum + f.effectiveness, 0) / feedbacks.length
    : 0;

  const averageSatisfaction = feedbacks.length > 0
    ? feedbacks.reduce((sum, f) => sum + f.satisfaction, 0) / feedbacks.length
    : 0;

  return (
    <Box>
      {/* 評価サマリー */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          評価サマリー
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              効果性
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Rating value={averageEffectiveness} readOnly precision={0.1} />
              <Typography variant="h6">
                {averageEffectiveness.toFixed(1)}
              </Typography>
            </Box>
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              満足度
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Rating value={averageSatisfaction} readOnly precision={0.1} />
              <Typography variant="h6">
                {averageSatisfaction.toFixed(1)}
              </Typography>
            </Box>
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              評価数
            </Typography>
            <Typography variant="h6">
              {feedbacks.length}件
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* フィードバック投稿フォーム */}
      {canSubmit && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            フィードバックを投稿
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              フィードバックを投稿しました
            </Alert>
          )}
          
          <Box sx={{ mb: 3 }}>
            <Typography component="legend" gutterBottom>
              効果性（生徒の学習効果）
            </Typography>
            <Rating
              value={effectiveness}
              onChange={(_, value) => setEffectiveness(value || 0)}
              size="large"
            />
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography component="legend" gutterBottom>
              満足度（授業の実施しやすさ）
            </Typography>
            <Rating
              value={satisfaction}
              onChange={(_, value) => setSatisfaction(value || 0)}
              size="large"
            />
          </Box>
          
          <TextField
            fullWidth
            multiline
            rows={4}
            label="コメント（任意）"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="このスタイルを使った感想や改善点などをお聞かせください"
            sx={{ mb: 3 }}
          />
          
          <Button
            variant="contained"
            startIcon={submitting ? <CircularProgress size={20} /> : <Send />}
            onClick={handleSubmit}
            disabled={submitting || effectiveness === 0 || satisfaction === 0}
            fullWidth
          >
            フィードバックを送信
          </Button>
        </Paper>
      )}

      {/* フィードバック一覧 */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          みんなのフィードバック
        </Typography>
        
        {feedbacks.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
            まだフィードバックがありません
          </Typography>
        ) : (
          <List>
            {feedbacks.map((feedback, index) => (
              <React.Fragment key={feedback.id}>
                {index > 0 && <Divider variant="inset" component="li" />}
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar>
                      <Person />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Typography variant="subtitle2">
                          {feedback.userName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDistanceToNow(new Date(feedback.date), {
                            addSuffix: true,
                            locale: ja,
                          })}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <>
                        <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              効果性:
                            </Typography>
                            <Rating
                              value={feedback.effectiveness}
                              readOnly
                              size="small"
                            />
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              満足度:
                            </Typography>
                            <Rating
                              value={feedback.satisfaction}
                              readOnly
                              size="small"
                            />
                          </Box>
                        </Box>
                        {feedback.comment && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {feedback.comment}
                          </Typography>
                        )}
                        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Button
                            size="small"
                            startIcon={<ThumbUp />}
                            sx={{ textTransform: 'none' }}
                          >
                            役に立った ({feedback.helpful})
                          </Button>
                        </Box>
                      </>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default StyleFeedback;