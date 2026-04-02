"use client";

import { useState, useRef, useEffect } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { vi } from "date-fns/locale/vi";
import "react-datepicker/dist/react-datepicker.css";
import "@/styles/datepicker-custom.css";

registerLocale("vi", vi);

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

function toISOString(date: Date | null): string {
    if (!date) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
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
    const [isoValue, setIsoValue] = useState<string>(
        (isControlled ? value : defaultValue) || ""
    );
    const [calendarOpen, setCalendarOpen] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);

    // Sync controlled value
    useEffect(() => {
        if (isControlled && value !== undefined) {
            setIsoValue(value);
        }
    }, [value, isControlled]);

    // Native input change (user types in dd/mm/yyyy segments)
    const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.value; // always yyyy-mm-dd from native input
        setIsoValue(newVal);
        onChange?.(newVal);
    };

    // Calendar pick
    const handleCalendarSelect = (date: Date | null) => {
        const iso = toISOString(date);
        setIsoValue(iso);
        setCalendarOpen(false);
        onChange?.(iso);
    };

    // Close calendar on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setCalendarOpen(false);
            }
        };
        if (calendarOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [calendarOpen]);

    return (
        <div className="datepicker-vn-wrapper relative inline-block" ref={pickerRef}>
            {/* Native date input — luôn controlled để đồng bộ với calendar */}
            <input
                type="date"
                name={name}
                value={isoValue}
                onChange={handleNativeChange}
                disabled={disabled}
                max="9999-12-31"
                className={className + " pr-8"}
            />

            {/* Calendar icon inside input — click mở lịch tiếng Việt */}
            {!disabled && (
                <button
                    type="button"
                    onClick={() => setCalendarOpen(!calendarOpen)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-purple-500 dark:text-slate-500 dark:hover:text-purple-400 transition-colors"
                    title="Mở lịch tiếng Việt"
                    tabIndex={-1}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </button>
            )}

            {/* Vietnamese calendar popup */}
            {calendarOpen && (
                <div className="absolute top-full left-0 mt-1 z-50">
                    <DatePicker
                        selected={parseISODate(isoValue)}
                        onChange={handleCalendarSelect}
                        locale="vi"
                        dateFormat="dd/MM/yyyy"
                        inline
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                    />
                </div>
            )}
        </div>
    );
}
