import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';

type AppTextFieldProps = TextFieldProps;

const AppTextField: React.FC<AppTextFieldProps> = ({ fullWidth = true, size = 'small', ...rest }) => {
  return <TextField fullWidth={fullWidth} size={size} {...rest} />;
};

export default AppTextField;
