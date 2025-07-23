import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Box,
  Chip,
} from '@mui/material';
import { DiagnosisQuestion } from '../../types/diagnosis';

interface QuestionCardProps {
  question: DiagnosisQuestion;
  currentAnswer?: number;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (value: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const answerOptions = [
  { value: 1, label: '全く当てはまらない' },
  { value: 2, label: 'あまり当てはまらない' },
  { value: 3, label: 'どちらとも言えない' },
  { value: 4, label: 'やや当てはまる' },
  { value: 5, label: '非常に当てはまる' },
];

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  currentAnswer,
  questionNumber,
  totalQuestions,
  onAnswer,
  onNext,
  onPrevious,
  isFirst,
  isLast,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onAnswer(parseInt(event.target.value));
  };

  return (
    <Card elevation={3}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              質問 {questionNumber} / {totalQuestions}
            </Typography>
            <Chip
              label={question.categoryName}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
          
          <Typography variant="h6" component="h2" gutterBottom>
            {question.question}
          </Typography>
        </Box>

        <RadioGroup
          value={currentAnswer || ''}
          onChange={handleChange}
          sx={{ mb: 4 }}
        >
          {answerOptions.map((option) => (
            <FormControlLabel
              key={option.value}
              value={option.value}
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: currentAnswer === option.value ? 'bold' : 'normal',
                    }}
                  >
                    {option.label}
                  </Typography>
                </Box>
              }
              sx={{
                mb: 1.5,
                '&:hover': {
                  backgroundColor: 'action.hover',
                  borderRadius: 1,
                },
                px: 1,
                mx: -1,
              }}
            />
          ))}
        </RadioGroup>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            variant="outlined"
            onClick={onPrevious}
            disabled={isFirst}
          >
            前へ
          </Button>
          
          <Button
            variant="contained"
            onClick={onNext}
            disabled={!currentAnswer}
          >
            {isLast ? '完了' : '次へ'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default QuestionCard;