import React, { useState, useEffect } from "react";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: string | number;
  onChangeValue: (value: string) => void;
}

export function CurrencyInput({ value, onChangeValue, className, ...props }: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState("");

  useEffect(() => {
    if (value === "" || value === undefined || value === null) {
      setDisplayValue("");
      return;
    }
    const rawVal = String(value).replace(/\D/g, "");
    if (rawVal) {
      setDisplayValue(new Intl.NumberFormat("id-ID").format(Number(rawVal)));
    } else {
      setDisplayValue("");
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    
    if (raw) {
      setDisplayValue(new Intl.NumberFormat("id-ID").format(Number(raw)));
    } else {
      setDisplayValue("");
    }
    
    onChangeValue(raw);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      className={className}
      {...props}
    />
  );
}
