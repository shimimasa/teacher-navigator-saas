import React from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  TextField,
  InputAdornment,
  Button,
  SelectChangeEvent,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Search,
  FilterList,
  Clear,
  ExpandMore,
} from '@mui/icons-material';
import {
  TeachingStyleFilter,
  TEACHING_STYLE_CATEGORIES,
  SUBJECT_OPTIONS,
  GRADE_LEVEL_OPTIONS,
  TECHNOLOGY_USE_OPTIONS,
} from '../../types/teachingStyle';

interface StyleFiltersProps {
  filters: TeachingStyleFilter;
  onFilterChange: (filters: TeachingStyleFilter) => void;
  onClearFilters: () => void;
}

const StyleFilters: React.FC<StyleFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
}) => {
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      search: event.target.value,
    });
  };

  const handleCheckboxChange = (filterType: keyof TeachingStyleFilter, value: string) => {
    const currentValues = (filters[filterType] as string[]) || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];

    onFilterChange({
      ...filters,
      [filterType]: newValues,
    });
  };

  const activeFilterCount = Object.values(filters).filter(
    value => value && (Array.isArray(value) ? value.length > 0 : value !== '')
  ).length;

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          フィルター
          {activeFilterCount > 0 && (
            <Chip
              label={`${activeFilterCount}個適用中`}
              size="small"
              color="primary"
              sx={{ ml: 2 }}
            />
          )}
        </Typography>
        
        {/* 検索バー */}
        <TextField
          fullWidth
          placeholder="スタイル名や説明で検索..."
          value={filters.search || ''}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 3 }}
        />

        {/* カテゴリーフィルター */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>カテゴリー</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              {Object.entries(TEACHING_STYLE_CATEGORIES).map(([key, value]) => (
                <FormControlLabel
                  key={key}
                  control={
                    <Checkbox
                      checked={filters.category?.includes(key) || false}
                      onChange={() => handleCheckboxChange('category', key)}
                      size="small"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2">{value.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {value.description}
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </FormGroup>
          </AccordionDetails>
        </Accordion>

        {/* 教科フィルター */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>教科</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              {SUBJECT_OPTIONS.map((subject) => (
                <FormControlLabel
                  key={subject.value}
                  control={
                    <Checkbox
                      checked={filters.subjects?.includes(subject.value) || false}
                      onChange={() => handleCheckboxChange('subjects', subject.value)}
                      size="small"
                    />
                  }
                  label={subject.label}
                />
              ))}
            </FormGroup>
          </AccordionDetails>
        </Accordion>

        {/* 学年フィルター */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>学年</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              {GRADE_LEVEL_OPTIONS.map((grade) => (
                <FormControlLabel
                  key={grade.value}
                  control={
                    <Checkbox
                      checked={filters.gradeLevel?.includes(grade.value) || false}
                      onChange={() => handleCheckboxChange('gradeLevel', grade.value)}
                      size="small"
                    />
                  }
                  label={grade.label}
                />
              ))}
            </FormGroup>
          </AccordionDetails>
        </Accordion>

        {/* テクノロジー使用度フィルター */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>テクノロジー使用度</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              {TECHNOLOGY_USE_OPTIONS.map((tech) => (
                <FormControlLabel
                  key={tech.value}
                  control={
                    <Checkbox
                      checked={filters.technologyUse?.includes(tech.value) || false}
                      onChange={() => handleCheckboxChange('technologyUse', tech.value)}
                      size="small"
                    />
                  }
                  label={tech.label}
                />
              ))}
            </FormGroup>
          </AccordionDetails>
        </Accordion>

        {/* フィルタークリアボタン */}
        {activeFilterCount > 0 && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<Clear />}
              onClick={onClearFilters}
              fullWidth
            >
              フィルターをクリア
            </Button>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default StyleFilters;