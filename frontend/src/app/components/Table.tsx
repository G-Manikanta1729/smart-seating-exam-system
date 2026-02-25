import React from 'react';

interface TableColumn {
  key: string;
  header: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface TableProps {
  columns: TableColumn[];
  data: any[];
}

export function Table({ columns, data }: TableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-xl">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-[#667eea]/10 to-[#764ba2]/10 border-b-2 border-[#667eea]/20">
            {columns.map((column) => (
              <th
                key={column.key}
                className="text-left px-6 py-4 text-sm font-semibold text-[#2D3748]"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={index}
              className="border-b border-[#E2E8F0] hover:bg-gradient-to-r hover:from-[#667eea]/5 hover:to-[#764ba2]/5 transition-all duration-200"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="px-6 py-4 text-sm text-[#2D3748]"
                >
                  {column.render
                    ? column.render(row[column.key], row)
                    : row[column.key]
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
