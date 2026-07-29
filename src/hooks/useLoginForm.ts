import { useState } from 'react';

interface LoginForm {
  email: string;
  senha: string;
  tipo_login: "ACS/ACE" | "UBS" | "";
}

interface LoginErrors {
  email?: string;
  senha?: string;
  tipo?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useLoginForm() {
  const [form, setForm] = useState<LoginForm>({
    email: "",
    senha: "",
    tipo_login: "",
  });

  const [errors, setErrors] = useState<LoginErrors>({});

  const [touched, setTouched] = useState<Record<keyof LoginForm, boolean>>({
    email: false,
    senha: false,
    tipo_login: false,
  });


  function validate(f: LoginForm): LoginErrors {
    const errs: LoginErrors = {};

    if (!f.email.trim()) {
      errs.email = 'E-mail obrigatório.';
    } else if (!EMAIL_REGEX.test(f.email.trim())) {
      errs.email = 'Informe um e-mail válido.';
    }

    if (!f.senha) {
      errs.senha = 'Senha obrigatória.';
    } else if (f.senha.length < 6) {
      errs.senha = 'A senha deve ter no mínimo 6 caracteres.';
    }
    
    if(!f.tipo_login) {
      errs.tipo = "Selecione o tipo de Usuário.";
    }

    return errs;
  }

  function handleChange(field: keyof LoginForm, value: string) {
    const updated = { ...form, [field]: value };
    setForm(updated);
    if (touched[field]) {
      setErrors(validate(updated));
    }
  }

  function handleBlur(field: keyof LoginForm) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate(form));
  }

  function validateAll(): boolean {
    setTouched({ email: true, senha: true, tipo_login: true });
    const errs = validate(form);
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const isValid = Object.keys(validate(form)).length === 0;

  return { form, errors, touched, handleChange, handleBlur, validateAll, isValid };
}