type LocaleStringDataProps = number | string | Date | undefined;
export const convertToLocaleString = (data: LocaleStringDataProps, culture?: string): string | number | undefined => {
  if (!data) {
    return data;
  }
  culture = culture || undefined;
  if (typeof data === 'number') {
    return data.toLocaleString(culture);
  } else if (typeof data === 'string' && !window.isNaN(Number(data))) {
    const num = Number(data);
    return num.toLocaleString(culture);
  } else if (data instanceof Date) {
    return data.toLocaleDateString(culture);
  }
  return data;
};
