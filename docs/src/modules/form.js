export const validators = {
    required: (value) => value && value.trim().length > 0,
    email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    minLength: (value, min) => value && value.trim().length >= min,
    maxLength: (value, max) => value && value.trim().length <= max
};

export function validateField(value, rules) {
    for (const rule of rules) {
        if (rule.type === 'required' && !validators.required(value)) return rule.message;
        if (rule.type === 'email' && !validators.email(value)) return rule.message;
        if (rule.type === 'minLength' && !validators.minLength(value, rule.param)) return rule.message;
        if (rule.type === 'maxLength' && !validators.maxLength(value, rule.param)) return rule.message;
    }
    return null;
}

export function validateForm(formData, schema) {
    const errors = {};
    for (const [field, rules] of Object.entries(schema)) {
        const error = validateField(formData[field], rules);
        if (error) errors[field] = error;
    }
    return errors;
}
