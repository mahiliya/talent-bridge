import { Request, Response, NextFunction } from 'express';

export const validateRegisterRequest = (req: Request, res: Response, next: NextFunction) => {
  const { fullName, email, password, confirmPassword } = req.body;
  const missingFields = [];

  // Check which fields are missing
  if (!fullName) missingFields.push('fullName');
  if (!email) missingFields.push('email');
  if (!password) missingFields.push('password');
  if (!confirmPassword) missingFields.push('confirmPassword');

  // If any fields are missing, return a detailed error
  if (missingFields.length > 0) {
    res.status(400).json({
      success: false,
      message: `Please provide the following required fields: ${missingFields.join(', ')}.`,
      error: 'MISSING_REQUIRED_FIELDS',
      missingFields
    });
    return;
  }

  // Check if fields are just empty strings or whitespace
  const emptyFields = [];
  if (fullName && fullName.trim() === '') emptyFields.push('fullName');
  if (email && email.trim() === '') emptyFields.push('email');
  
  if (emptyFields.length > 0) {
    res.status(400).json({
      success: false,
      message: `The following fields cannot be empty: ${emptyFields.join(', ')}.`,
      error: 'EMPTY_FIELDS',
      emptyFields
    });
    return;
  }

  next();
};

export const validateCompanyRegisterRequest = (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password, confirmPassword } = req.body;
  const missingFields = [];

  // Check which fields are missing
  if (!name) missingFields.push('name');
  if (!email) missingFields.push('email');
  if (!password) missingFields.push('password');
  if (!confirmPassword) missingFields.push('confirmPassword');

  // If any fields are missing, return a detailed error
  if (missingFields.length > 0) {
    res.status(400).json({
      success: false,
      message: `Please provide the following required fields: ${missingFields.join(', ')}.`,
      error: 'MISSING_REQUIRED_FIELDS',
      missingFields
    });
    return;
  }

  // Check if fields are just empty strings or whitespace
  const emptyFields = [];
  if (name && name.trim() === '') emptyFields.push('name');
  if (email && email.trim() === '') emptyFields.push('email');
  
  if (emptyFields.length > 0) {
    res.status(400).json({
      success: false,
      message: `The following fields cannot be empty: ${emptyFields.join(', ')}.`,
      error: 'EMPTY_FIELDS',
      emptyFields
    });
    return;
  }

  next();
};

export const validateLoginRequest = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  const missingFields = [];

  // Check which fields are missing
  if (!email) missingFields.push('email');
  if (!password) missingFields.push('password');

  // If any fields are missing, return a detailed error
  if (missingFields.length > 0) {
    res.status(400).json({
      success: false,
      message: `Please provide the following required fields: ${missingFields.join(', ')}.`,
      error: 'MISSING_REQUIRED_FIELDS',
      missingFields
    });
    return;
  }

  // Check if fields are just empty strings or whitespace
  const emptyFields = [];
  if (email && email.trim() === '') emptyFields.push('email');
  if (password && password.trim() === '') emptyFields.push('password');
  
  if (emptyFields.length > 0) {
    res.status(400).json({
      success: false,
      message: `The following fields cannot be empty: ${emptyFields.join(', ')}.`,
      error: 'EMPTY_FIELDS',
      emptyFields
    });
    return;
  }

  next();
};

export const validateJobRequest = (req: Request, res: Response, next: NextFunction) => {
  const { title, description } = req.body;
  const missingFields = [];

  // Check which required fields are missing
  if (!title) missingFields.push('title');
  if (!description) missingFields.push('description');

  // If any required fields are missing, return a detailed error
  if (missingFields.length > 0) {
    res.status(400).json({
      success: false,
      message: `Please provide the following required fields: ${missingFields.join(', ')}.`,
      error: 'MISSING_REQUIRED_FIELDS',
      missingFields
    });
    return;
  }

  // Check if fields are just empty strings or whitespace
  const emptyFields = [];
  if (title && title.trim() === '') emptyFields.push('title');
  if (description && description.trim() === '') emptyFields.push('description');
  
  if (emptyFields.length > 0) {
    res.status(400).json({
      success: false,
      message: `The following fields cannot be empty: ${emptyFields.join(', ')}.`,
      error: 'EMPTY_FIELDS',
      emptyFields
    });
    return;
  }

  next();
};
