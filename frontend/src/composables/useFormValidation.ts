import { ref, computed, readonly, type Ref } from 'vue'

export interface ValidationRule {
  message: string
  validator: (value: any) => boolean
}

export interface ValidationRules {
  [key: string]: ValidationRule[]
}

export interface ValidationErrors {
  [key: string]: string[]
}

export function useFormValidation<T extends Record<string, any>>(
  formData: Ref<T>,
  rules: ValidationRules
) {
  const errors = ref<ValidationErrors>({})
  const touched = ref<Record<string, boolean>>({})

  // Validate a single field
  const validateField = (fieldName: string): boolean => {
    const fieldRules = rules[fieldName]
    if (!fieldRules) return true

    const fieldErrors: string[] = []
    const value = formData.value[fieldName]

    for (const rule of fieldRules) {
      if (!rule.validator(value)) {
        fieldErrors.push(rule.message)
      }
    }

    errors.value[fieldName] = fieldErrors
    return fieldErrors.length === 0
  }

  // Validate all fields
  const validateForm = (): boolean => {
    let isValid = true

    for (const fieldName of Object.keys(rules)) {
      const fieldValid = validateField(fieldName)
      if (!fieldValid) {
        isValid = false
      }
    }

    return isValid
  }

  // Mark field as touched
  const touchField = (fieldName: string) => {
    touched.value[fieldName] = true
  }

  // Clear errors for a field
  const clearFieldError = (fieldName: string) => {
    if (errors.value[fieldName]) {
      errors.value[fieldName] = []
    }
  }

  // Clear all errors
  const clearErrors = () => {
    errors.value = {}
  }

  // Get errors for a specific field
  const getFieldErrors = (fieldName: string): string[] => {
    return errors.value[fieldName] || []
  }

  // Check if field has errors
  const hasFieldError = (fieldName: string): boolean => {
    return getFieldErrors(fieldName).length > 0
  }

  // Check if field is touched
  const isFieldTouched = (fieldName: string): boolean => {
    return touched.value[fieldName] || false
  }

  // Check if form is valid
  const isFormValid = computed(() => {
    return Object.values(errors.value).every(fieldErrors => fieldErrors.length === 0)
  })

  // Check if form has any errors
  const hasErrors = computed(() => {
    return Object.values(errors.value).some(fieldErrors => fieldErrors.length > 0)
  })

  return {
    errors: readonly(errors),
    touched: readonly(touched),
    validateField,
    validateForm,
    touchField,
    clearFieldError,
    clearErrors,
    getFieldErrors,
    hasFieldError,
    isFieldTouched,
    isFormValid,
    hasErrors,
  }
}

// Common validation rules
export const validationRules = {
  required: (message = 'この項目は必須です'): ValidationRule => ({
    message,
    validator: (value: any) => {
      if (typeof value === 'string') {
        return value.trim().length > 0
      }
      return value !== null && value !== undefined && value !== ''
    }
  }),

  email: (message = '有効なメールアドレスを入力してください'): ValidationRule => ({
    message,
    validator: (value: string) => {
      if (!value) return false
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(value)
    }
  }),

  minLength: (length: number, message?: string): ValidationRule => ({
    message: message || `${length}文字以上で入力してください`,
    validator: (value: string) => {
      return !!value && value.length >= length
    }
  }),

  maxLength: (length: number, message?: string): ValidationRule => ({
    message: message || `${length}文字以下で入力してください`,
    validator: (value: string) => {
      return !value || value.length <= length
    }
  }),

  match: (otherValue: Ref<string>, message = 'パスワードが一致しません'): ValidationRule => ({
    message,
    validator: (value: string) => {
      return value === otherValue.value
    }
  }),

  numeric: (message = '数値を入力してください'): ValidationRule => ({
    message,
    validator: (value: any) => {
      return !isNaN(Number(value)) && isFinite(Number(value))
    }
  }),

  positive: (message = '正の数値を入力してください'): ValidationRule => ({
    message,
    validator: (value: unknown) => {
      const num = Number(value)
      return !isNaN(num) && num > 0
    }
  })
}
