import React, { useEffect, useState } from 'react';
import { Download, FileText, Printer, Calendar, Users, BarChart3 } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { Select } from './Select';
import api from '../../api/api';

export function Reports() {
  const [exams, setExams] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);

  const [selectedExam, setSelectedExam] = useState<string>('');
  const [selectedReportType, setSelectedReportType] = useState<string>('ALL');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all');

  useEffect(() => {
    loadExams();
    loadRecentDownloads();
  }, []);

  const loadExams = async () => {
    try {
      const res = await api.get('/admin/exams');
      setExams(res.data);
    } catch (err) {
      console.error('Failed to load exams', err);
    }
  };

  const loadRecentDownloads = async () => {
    try {
      const res = await api.get('/reports/recent');
      setRecent(res.data);
    } catch (err) {
      console.error('Failed to load recent downloads', err);
    }
  };

  const downloadReport = (
    reportType: string,
    format: "pdf" | "excel"
  ) => {
    const token = localStorage.getItem("token") || "";

    const params = new URLSearchParams({
      reportType: reportType === "ALL" ? "" : reportType,
      examId: selectedExam || "",
      dateRange: selectedDateRange,
      format,
      token,
    });

    const url = `http://localhost:5000/api/reports/download?${params.toString()}`;
    window.open(url, "_blank");
  };

  const printReport = (reportType: string) => {
    const token = localStorage.getItem("token") || "";

    const params = new URLSearchParams({
      reportType: reportType === "ALL" ? "" : reportType,
      examId: selectedExam || "",
      dateRange: selectedDateRange,
      token,
    });

    const url = `http://localhost:5000/api/reports/print?${params.toString()}`;
    window.open(url, "_blank");
  };

  const reports = [
    {
      key: 'SEATING',
      title: 'Seating Arrangement Report',
      description: 'Complete seating arrangement for all exams',
      icon: '📋',
    },
    {
      key: 'FACULTY',
      title: 'Faculty Allocation Report',
      description: 'Room-wise faculty allocation details',
      icon: '👨‍🏫',
    },
    {
      key: 'ATTENDANCE',
      title: 'Attendance Report',
      description: 'Student attendance for completed exams',
      icon: '✓',
    },
    {
      key: 'ROOM',
      title: 'Room Utilization Report',
      description: 'Room capacity and utilization statistics',
      icon: '🏢',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Reports</h1>
      <p className="text-gray-600">Download and view examination reports</p>

      {/* Filter Section */}
      <Card>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Exam
            </label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Exams</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.exam_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Types</option>
              <option value="SEATING">Seating Arrangement</option>
              <option value="FACULTY">Faculty Allocation</option>
              <option value="ATTENDANCE">Attendance</option>
              <option value="ROOM">Room Utilization</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">Last 3 Months</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Reports Grid */}
      <div className="grid grid-cols-2 gap-6">
        {reports
          .filter(
            (r) =>
              selectedReportType === 'ALL' || selectedReportType === r.key
          )
          .map((report) => (
            <Card key={report.key}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {report.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {report.description}
                  </p>
                </div>
                <span className="text-3xl">{report.icon}</span>
              </div>

              <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
                <Button
                  onClick={() => downloadReport(report.key, 'pdf')}
                  className="flex-1 bg-blue-500 hover:bg-blue-600"
                >
                  <Download size={16} className="inline mr-2" />
                  PDF
                </Button>
                <Button
                  onClick={() => downloadReport(report.key, 'excel')}
                  className="flex-1 bg-green-500 hover:bg-green-600"
                >
                  <Download size={16} className="inline mr-2" />
                  Excel
                </Button>
                <Button
                  onClick={() => printReport(report.key)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600"
                >
                  <Printer size={16} className="inline mr-2" />
                  Print
                </Button>
              </div>
            </Card>
          ))}
      </div>

      {/* Recent Downloads */}
      {recent.length > 0 && (
        <Card title="Recent Report Downloads">
          <div className="space-y-3">
            {recent.map((r: any, i: number) => (
              <div
                key={i}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {r.report_type} - {r.exam_name || 'All Exams'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Downloaded by Admin{r.downloaded_by}
                  </p>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
