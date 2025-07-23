import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Grid,
  Divider,
} from '@mui/material';
import { Psychology, EmojiObjects, Warning } from '@mui/icons-material';
import { DiagnosisResult } from '../../types/diagnosis';

interface PersonalityTypeCardProps {
  result: DiagnosisResult;
}

// MBTI型の日本語説明
const personalityTypeDescriptions: Record<string, string> = {
  INTJ: '建築家型 - 想像力豊かで戦略的な思考の持ち主',
  INTP: '論理学者型 - 貪欲な知識欲を持つ革新的な発明家',
  ENTJ: '指揮官型 - 大胆で想像力豊か、かつ強い意志を持つリーダー',
  ENTP: '討論者型 - 賢くて好奇心旺盛な思考家',
  INFJ: '提唱者型 - 物静かで神秘的だが、人々を非常に勇気づける理想主義者',
  INFP: '仲介者型 - 詩的で親切な利他主義者',
  ENFJ: '主人公型 - カリスマ性があり、人々を励ますリーダー',
  ENFP: '運動家型 - 情熱的で独創力があり、社交的な自由人',
  ISTJ: '管理者型 - 実用的で事実を重視する、信頼性の高い人',
  ISFJ: '擁護者型 - 非常に献身的で心の温かい擁護者',
  ESTJ: '幹部型 - 優秀な管理者で、物事や人々を管理する能力に長けている',
  ESFJ: '領事型 - 非常に思いやりがあり社交的で、人気がある',
  ISTP: '巨匠型 - 大胆で実践的な実験者',
  ISFP: '冒険家型 - 柔軟性と魅力を持つ芸術家',
  ESTP: '起業家型 - 賢くてエネルギッシュで、非常に鋭い知覚の持ち主',
  ESFP: 'エンターテイナー型 - 自発的でエネルギッシュ、熱心なエンターテイナー',
};

const PersonalityTypeCard: React.FC<PersonalityTypeCardProps> = ({ result }) => {
  const { personalityType, typeDescription, scores, strengths, challenges } = result;

  // 各軸の傾向を計算
  const getPreference = (score: number, highLabel: string, lowLabel: string) => {
    return score >= 60 ? highLabel : lowLabel;
  };

  const preferences = {
    energy: getPreference(scores.extroversion, '外向型 (E)', '内向型 (I)'),
    information: getPreference(scores.sensing, '感覚型 (S)', '直感型 (N)'),
    decision: getPreference(scores.thinking, '思考型 (T)', '感情型 (F)'),
    lifestyle: getPreference(scores.judging, '判断型 (J)', '知覚型 (P)'),
  };

  return (
    <Card elevation={3}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Psychology sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h3" component="h2" gutterBottom color="primary">
            {personalityType}
          </Typography>
          <Typography variant="h5" gutterBottom>
            {personalityTypeDescriptions[personalityType] || typeDescription}
          </Typography>
        </Box>

        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Chip
                label={preferences.energy}
                color={scores.extroversion >= 60 ? 'primary' : 'default'}
                sx={{ mb: 1 }}
              />
              <Typography variant="caption" display="block" color="text.secondary">
                エネルギーの方向
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Chip
                label={preferences.information}
                color={scores.sensing >= 60 ? 'primary' : 'default'}
                sx={{ mb: 1 }}
              />
              <Typography variant="caption" display="block" color="text.secondary">
                情報の捉え方
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Chip
                label={preferences.decision}
                color={scores.thinking >= 60 ? 'primary' : 'default'}
                sx={{ mb: 1 }}
              />
              <Typography variant="caption" display="block" color="text.secondary">
                判断の仕方
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Chip
                label={preferences.lifestyle}
                color={scores.judging >= 60 ? 'primary' : 'default'}
                sx={{ mb: 1 }}
              />
              <Typography variant="caption" display="block" color="text.secondary">
                外界への接し方
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EmojiObjects sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">あなたの強み</Typography>
              </Box>
              <Box component="ul" sx={{ pl: 3 }}>
                {strengths.map((strength, index) => (
                  <Typography component="li" key={index} sx={{ mb: 1 }}>
                    {strength}
                  </Typography>
                ))}
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Warning sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">注意すべき点</Typography>
              </Box>
              <Box component="ul" sx={{ pl: 3 }}>
                {challenges.map((challenge, index) => (
                  <Typography component="li" key={index} sx={{ mb: 1 }}>
                    {challenge}
                  </Typography>
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, p: 3, bgcolor: 'background.default', borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary" align="center">
            このパーソナリティタイプは、あなたの教育スタイルの傾向を示すものです。
            これらの特性を理解し、強みを活かしながら、より効果的な授業を設計しましょう。
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PersonalityTypeCard;