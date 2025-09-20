import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useFormValidation, validationRules } from '../useFormValidation'

describe('useFormValidation', () => {
  it('validates required fields correctly', () => {
    const form = ref({ email: '', password: '' })
    const rules = {
      email: [validationRules.required()],
      password: [validationRules.required()]
    }

    const { validateForm, hasFieldError, getFieldErrors } = useFormValidation(form, rules)

    // Should fail validation with empty values
    expect(validateForm()).toBe(false)
    expect(hasFieldError('email')).toBe(true)
    expect(hasFieldError('password')).toBe(true)

    // Should pass validation with values
    form.value.email = 'test@example.com'
    form.value.password = 'password123'
    expect(validateForm()).toBe(true)
    expect(hasFieldError('email')).toBe(false)
    expect(hasFieldError('password')).toBe(false)
  })

  it('validates email format correctly', () => {
    const form = ref({ email: '' })
    const rules = {
      email: [validationRules.email()]
    }

    const { validateField, hasFieldError } = useFormValidation(form, rules)

    // Invalid email
    form.value.email = 'invalid-email'
    validateField('email')
    expect(hasFieldError('email')).toBe(true)

    // Valid email
    form.value.email = 'test@example.com'
    validateField('email')
    expect(hasFieldError('email')).toBe(false)
  })

  it('validates password length correctly', () => {
    const form = ref({ password: '' })
    const rules = {
      password: [validationRules.minLength(6)]
    }

    const { validateField, hasFieldError } = useFormValidation(form, rules)

    // Too short
    form.value.password = '123'
    validateField('password')
    expect(hasFieldError('password')).toBe(true)

    // Valid length
    form.value.password = '123456'
    validateField('password')
    expect(hasFieldError('password')).toBe(false)
  })

  it('validates password match correctly', () => {
    const form = ref({ password: 'password123', confirmPassword: '' })
    const rules = {
      confirmPassword: [validationRules.match(ref(form.value.password))]
    }

    const { validateField, hasFieldError } = useFormValidation(form, rules)

    // Passwords don't match
    form.value.confirmPassword = 'different'
    validateField('confirmPassword')
    expect(hasFieldError('confirmPassword')).toBe(true)

    // Passwords match
    form.value.confirmPassword = 'password123'
    validateField('confirmPassword')
    expect(hasFieldError('confirmPassword')).toBe(false)
  })
})
