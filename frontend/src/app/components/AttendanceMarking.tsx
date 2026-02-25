import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, XCircle } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { Table } from './Table';
import { useLocation, useSearchParams } from 'react-router-dom';
import api from '../../api/api';

export function AttendanceMarking() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const examId = searchParams.get('examId');
  const room = searchParams.get('room');
  const examType = searchParams.get("examType") || "REGULAR"; // ✅ FIX: read examType
  const examName = (location.state as any)?.examName || '';
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!examId) return;

      try {
        let seatingRes;
        if (examType === "SEMESTER") {
          // ✅ Use dedicated semester attendance seating endpoint
          seatingRes = await api.get(`/faculty/semester/seating/${examId}`);
        } else {
          seatingRes = await api.get(`/admin/seating/${examId}`);
        }

        const rows = room
          ? seatingRes.data.filter((r: any) => r.room_name === room)
          : seatingRes.data;

        const attendanceRes = await api.get(`/attendance/${examType}/${examId}`);
        const saved = attendanceRes.data || [];

        const mapped = rows.map((r: any, idx: number) => {
          const savedRow = saved.find((s: any) => s.student_id === r.student_id);
          return {
            bench: idx + 1,
            student_id: r.student_id,
            rollNo: r.roll_number,
            name: r.name,
            present: savedRow ? savedRow.status === "PRESENT" : false,
          };
        });

        setAttendance(mapped);

        if (saved.length > 0 && saved[0].is_submitted === 1) {
          setIsLocked(true);
        }
      } catch (err) {
        console.error("Load attendance error:", err);
      }
    };

    loadData();
  }, [examId, room, examType]);

  const toggleAttendance = (rollNo: string) => {
    if (!isLocked) {
      setAttendance(
        attendance.map((student) =>
          student.rollNo === rollNo
            ? { ...student, present: !student.present }
            : student
        )
      );
    }
  };

  const presentCount = attendance.filter((s) => s.present).length;
  const absentCount = attendance.length - presentCount;

  const columns = [
    { key: 'bench', header: 'Bench No.' },
    { key: 'rollNo', header: 'Roll Number' },
    { key: 'name', header: 'Student Name' },
    {
      key: 'present',
      header: 'Attendance',
      render: (value: boolean, row: any) => (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value}
            onChange={() => toggleAttendance(row.rollNo)}
            disabled={isLocked}
            className="w-5 h-5 accent-[#2563EB] cursor-pointer disabled:cursor-not-allowed"
          />
          <span
            className={`px-3 py-1 rounded-full text-xs ${value
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
              }`}
          >
            {value ? 'Present' : 'Absent'}
          </span>
        </label>
      ),
    },
  ];

  const saveDraft = async () => {
    try {
      const records = attendance
        .filter((s) => s.student_id)
        .map((s) => ({
          student_id: s.student_id,
          status: s.present ? "PRESENT" : "ABSENT",
        }));

      if (records.length === 0) {
        alert("No attendance data to save");
        return;
      }

      await api.post("/attendance/draft", {
        examType,
        examId,
        records,
      });

      alert("Draft saved successfully");
    } catch (err) {
      console.error("Save draft error:", err);
      alert("Failed to save draft");
    }
  };

  const submitAttendance = async () => {
    try {
      await saveDraft();

      await api.post("/attendance/submit", {
        examType,
        examId,
      });

      setIsLocked(true);
      alert("Attendance submitted successfully");
    } catch (err) {
      console.error("Submit attendance error:", err);
      alert("Failed to submit attendance");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-[#0F172A] mb-2">Mark Attendance</h1>
        <p className="text-[#64748B]">{examName} {room ? `- ${room}` : ''}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6">
        <Card>
          <div className="text-center">
            <p className="text-sm text-[#64748B] mb-2">Total Students</p>
            <p className="text-3xl text-[#0F172A]">{attendance.length}</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle size={16} className="text-green-600" />
              <p className="text-sm text-[#64748B]">Present</p>
            </div>
            <p className="text-3xl text-green-600">{presentCount}</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <XCircle size={16} className="text-red-600" />
              <p className="text-sm text-[#64748B]">Absent</p>
            </div>
            <p className="text-3xl text-red-600">{absentCount}</p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-sm text-[#64748B] mb-2">Attendance %</p>
            <p className="text-3xl text-[#2563EB]">
              {attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0}%
            </p>
          </div>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card>
        {isLocked && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle size={20} className="text-green-600" />
            <div>
              <p className="text-sm text-green-800">Attendance has been locked and submitted</p>
              <p className="text-xs text-green-600">No further changes can be made</p>
            </div>
          </div>
        )}

        <Table columns={columns} data={attendance} />

        <div className="mt-6 pt-6 border-t border-[#E2E8F0] flex gap-3">
          {!isLocked ? (
            <>
              <Button onClick={submitAttendance} className="flex-1">
                <Save size={20} className="inline mr-2" />
                Lock & Submit Attendance
              </Button>
              <Button variant="secondary" className="flex-1" onClick={saveDraft}>
                Save Draft
              </Button>
            </>
          ) : (
            <Button variant="secondary" className="flex-1" disabled>
              Attendance Submitted
            </Button>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      {!isLocked && (
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#64748B]">Quick Actions</p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="text-sm py-1.5"
                onClick={() => {
                  setAttendance(attendance.map((s) => ({ ...s, present: true })));
                }}
              >
                Mark All Present
              </Button>
              <Button
                variant="secondary"
                className="text-sm py-1.5"
                onClick={() => {
                  setAttendance(attendance.map((s) => ({ ...s, present: false })));
                }}
              >
                Mark All Absent
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}