const normalizeCsvValue = (value) => {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
};

const escapeCsvValue = (value) => {
  const normalizedValue = normalizeCsvValue(value);

  if (/[",\r\n]/.test(normalizedValue)) {
    return `"${normalizedValue.replace(/"/g, '""')}"`;
  }

  return normalizedValue;
};

export const formatDateForCsv = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toISOString();
};

export const downloadCsv = (filename, rows = [], columns = []) => {
  const safeFilename = filename.toLowerCase().endsWith(".csv")
    ? filename
    : `${filename}.csv`;

  const headers = columns.map((column) => column.header);
  const bodyRows = rows.map((row) =>
    columns.map((column) => {
      const value =
        typeof column.value === "function" ? column.value(row) : row[column.key];
      return escapeCsvValue(value);
    })
  );

  const csvContent = [headers.map(escapeCsvValue), ...bodyRows]
    .map((values) => values.join(","))
    .join("\r\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = safeFilename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
