import React, { useState } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  Popover,
  TextField,
  Typography,
  Stack,
} from '@mui/material';
import {
  CalendarToday,
  ArrowDropDown,
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { ja } from 'date-fns/locale';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subMonths, subYears } from 'date-fns';
import { AnalyticsTimeRange, TIME_RANGES } from '../../types/analytics';

interface DateRangePickerProps {
  value: AnalyticsTimeRange;
  onChange: (range: AnalyticsTimeRange) => void;
  presets?: boolean;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  presets = true,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [startDate, setStartDate] = useState<Date | null>(value.startDate);
  const [endDate, setEndDate] = useState<Date | null>(value.endDate);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handlePresetClick = (preset: string) => {
    const today = new Date();
    let start: Date;
    let end: Date;

    switch (preset) {
      case 'day':
        start = startOfDay(today);
        end = endOfDay(today);
        break;
      case 'week':
        start = startOfWeek(today, { locale: ja });
        end = endOfWeek(today, { locale: ja });
        break;
      case 'month':
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      case 'quarter':
        start = startOfMonth(subMonths(today, 2));
        end = endOfMonth(today);
        break;
      case 'year':
        start = startOfYear(today);
        end = endOfYear(today);
        break;
      case 'last7days':
        start = startOfDay(subDays(today, 6));
        end = endOfDay(today);
        break;
      case 'last30days':
        start = startOfDay(subDays(today, 29));
        end = endOfDay(today);
        break;
      case 'last3months':
        start = startOfDay(subMonths(today, 3));
        end = endOfDay(today);
        break;
      case 'lastyear':
        start = startOfDay(subYears(today, 1));
        end = endOfDay(today);
        break;
      default:
        return;
    }

    setStartDate(start);
    setEndDate(end);
    onChange({
      startDate: start,
      endDate: end,
      period: preset as any,
    });
    handleClose();
  };

  const handleCustomRangeApply = () => {
    if (startDate && endDate) {
      onChange({
        startDate: startOfDay(startDate),
        endDate: endOfDay(endDate),
        period: 'custom',
      });
      handleClose();
    }
  };

  const formatDateRange = () => {
    if (value.period === 'custom' || !value.period) {
      return `${format(value.startDate, 'yyyy/MM/dd', { locale: ja })} - ${format(value.endDate, 'yyyy/MM/dd', { locale: ja })}`;
    }
    const preset = TIME_RANGES.find(r => r.value === value.period);
    return preset?.label || 'カスタム';
  };

  const open = Boolean(anchorEl);

  return (
    <Box>
      <Button
        variant="outlined"
        onClick={handleClick}
        startIcon={<CalendarToday />}
        endIcon={<ArrowDropDown />}
        sx={{ minWidth: 200 }}
      >
        {formatDateRange()}
      </Button>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2, minWidth: 300 }}>
          {presets && (
            <>
              <Typography variant="subtitle2" gutterBottom>
                プリセット期間
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Stack spacing={1}>
                  <Box>
                    <ButtonGroup size="small" fullWidth>
                      <Button onClick={() => handlePresetClick('day')}>今日</Button>
                      <Button onClick={() => handlePresetClick('week')}>今週</Button>
                      <Button onClick={() => handlePresetClick('month')}>今月</Button>
                    </ButtonGroup>
                  </Box>
                  <Box>
                    <ButtonGroup size="small" fullWidth>
                      <Button onClick={() => handlePresetClick('quarter')}>四半期</Button>
                      <Button onClick={() => handlePresetClick('year')}>今年</Button>
                    </ButtonGroup>
                  </Box>
                  <Box>
                    <ButtonGroup size="small" fullWidth>
                      <Button onClick={() => handlePresetClick('last7days')}>過去7日</Button>
                      <Button onClick={() => handlePresetClick('last30days')}>過去30日</Button>
                    </ButtonGroup>
                  </Box>
                  <Box>
                    <ButtonGroup size="small" fullWidth>
                      <Button onClick={() => handlePresetClick('last3months')}>過去3ヶ月</Button>
                      <Button onClick={() => handlePresetClick('lastyear')}>過去1年</Button>
                    </ButtonGroup>
                  </Box>
                </Stack>
              </Box>
            </>
          )}

          <Typography variant="subtitle2" gutterBottom>
            カスタム期間
          </Typography>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
            <Stack spacing={2}>
              <DatePicker
                label="開始日"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                  },
                }}
              />
              <DatePicker
                label="終了日"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                minDate={startDate || undefined}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                  },
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button size="small" onClick={handleClose}>
                  キャンセル
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleCustomRangeApply}
                  disabled={!startDate || !endDate}
                >
                  適用
                </Button>
              </Box>
            </Stack>
          </LocalizationProvider>
        </Box>
      </Popover>
    </Box>
  );
};

export default DateRangePicker;