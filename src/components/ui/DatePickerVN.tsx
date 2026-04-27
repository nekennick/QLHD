"use client";

import { useEffect, useState } from "react";

interface DatePickerVNProps {
    name: string;
    value?: string;           // controlled: "yyyy-mm-dd"
    defaultValue?: string;    // uncontrolled: "yyyy-mm-dd"
    onChange?: (value: string) => void;
    disabled?: boolean;
    className?: string;
}

function parseISODate(str: string | undefined): Date | null {
    if (!str) return null;
    const d = new Date(str + "T00:00:00");
    return isNaN(d.getTime()) ? null : d;
}

function formatDisplayDate(iso: string | undefined): string {
    const date = parseISODate(iso);
    if (!date) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function formatManualInput(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    const day = digits.slice(0, 2);
    const month = digits.slice(2, 4);
    const year = digits.slice(4, 8);
    return [day, month, year].filter(Boolean).join("/");
}

function parseDisplayDate(value: string): string {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
    if (!match) return "";

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const date = new Date(year, month - 1, day);

    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return "";
    }

    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function DatePickerVN({
    name,
    value,
    defaultValue,
    onChange,
    disabled = false,
    className = "",
}: DatePickerVNProps) {
    const isControlled = value !== undefined;
    const initialValue = (isControlled ? value : defaultValue) || "";
    const [isoValue, setIsoValue] = useState<string>(initialValue);
    const [displayValue, setDisplayValue] = useState<string>(formatDisplayDate(initialValue));

    useEffect(() => {
        if (isControlled && value !== undefined) {
            setIsoValue(value);
            setDisplayValue(formatDisplayDate(value));
        }
    }, [value, isControlled]);

    const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const display = formatManualInput(e.target.value);
        setDisplayValue(display);

        if (!display) {
            setIsoValue("");
            onChange?.("");
            return;
        }

        if (display.length === 10) {
            const iso = parseDisplayDate(display);
            setIsoValue(iso);
            onChange?.(iso);
            return;
        }

        setIsoValue("");
    };

    return (
        <div className="datepicker-vn-wrapper inline-block">
            <input
                type="text"
                value={displayValue}
                onChange={handleManualChange}
                disabled={disabled}
                inputMode="numeric"
                maxLength={10}
                placeholder="dd/mm/yyyy"
                className={className}
                aria-label={name}
            />
            <input type="hidden" name={name} value={isoValue} disabled={disabled} />
        </div>
    );
}
