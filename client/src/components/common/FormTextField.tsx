import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';

interface FormTextFieldProps extends Omit<TextFieldProps, 'onChange'> {
  name: string;
  value: string | number;
  onChange: (name: string, value: string) => void;
  validationError?: string;
  loading?: boolean;
}

/**
 * 共通のフォーム用テキストフィールドコンポーネント
 */
const FormTextField: React.FC<FormTextFieldProps> = ({
  name,
  value,
  onChange,
  validationError,
  loading = false,
  ...textFieldProps
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(name, e.target.value);
  };

  return (
    <TextField
      {...textFieldProps}
      name={name}
      value={value}
      onChange={handleChange}
      error={!!validationError}
      helperText={validationError || textFieldProps.helperText}
      disabled={loading || textFieldProps.disabled}
      margin={textFieldProps.margin || 'normal'}
      fullWidth={textFieldProps.fullWidth !== false}
    />
  );
};

export default FormTextField;