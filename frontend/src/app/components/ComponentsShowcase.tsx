import React, { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import { Card } from './Card';
import { Table } from './Table';
import { StatCard } from './StatCard';
import { Modal } from './Modal';
import { Users, DoorOpen, FileText, CheckCircle } from 'lucide-react';

export function ComponentsShowcase() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tableData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Faculty' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Student' },
  ];

  const tableColumns = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl text-[#0F172A] mb-2">Component Showcase</h1>
        <p className="text-[#64748B]">Reusable UI components for the Smart Seating Arrangement System</p>
      </div>

      {/* Buttons */}
      <Card title="Buttons">
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="danger">Danger Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="primary" disabled>Disabled Button</Button>
        </div>
      </Card>

      {/* Inputs */}
      <Card title="Input Fields">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Text Input" placeholder="Enter text..." />
          <Input label="Email Input" type="email" placeholder="Enter email..." />
          <Input label="Password Input" type="password" placeholder="Enter password..." />
          <Input label="Number Input" type="number" placeholder="Enter number..." />
        </div>
      </Card>

      {/* Select Dropdowns */}
      <Card title="Select Dropdowns">
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Select Option"
            options={[
              { value: '', label: 'Choose an option' },
              { value: 'option1', label: 'Option 1' },
              { value: 'option2', label: 'Option 2' },
              { value: 'option3', label: 'Option 3' },
            ]}
          />
          <Select
            label="Select Branch"
            options={[
              { value: '', label: 'Select Branch' },
              { value: 'cs', label: 'Computer Science' },
              { value: 'ec', label: 'Electronics' },
              { value: 'me', label: 'Mechanical' },
            ]}
          />
        </div>
      </Card>

      {/* Stat Cards */}
      <div>
        <h3 className="text-lg text-[#0F172A] mb-4">Statistics Cards</h3>
        <div className="grid grid-cols-4 gap-6">
          <StatCard
            title="Total Students"
            value="1,248"
            icon={<Users size={24} />}
            color="#2563EB"
          />
          <StatCard
            title="Total Rooms"
            value="32"
            icon={<DoorOpen size={24} />}
            color="#10B981"
          />
          <StatCard
            title="Today's Exams"
            value="5"
            icon={<FileText size={24} />}
            color="#F59E0B"
          />
          <StatCard
            title="Completed"
            value="3"
            icon={<CheckCircle size={24} />}
            color="#8B5CF6"
          />
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-3 gap-6">
        <Card title="Simple Card">
          <p className="text-sm text-[#64748B]">
            This is a simple card component with a title and content area.
          </p>
        </Card>
        <Card>
          <h4 className="mb-2">Card Without Title</h4>
          <p className="text-sm text-[#64748B]">
            Cards can also be used without a predefined title.
          </p>
        </Card>
        <Card title="Action Card">
          <p className="text-sm text-[#64748B] mb-3">
            Cards can contain buttons and other interactive elements.
          </p>
          <Button variant="primary" className="w-full">Take Action</Button>
        </Card>
      </div>

      {/* Table */}
      <Card title="Data Table">
        <Table columns={tableColumns} data={tableData} />
      </Card>

      {/* Modal */}
      <Card title="Modal Dialog">
        <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Example Modal"
        >
          <div className="space-y-4">
            <p className="text-[#64748B]">
              This is an example modal dialog. It can contain forms, information, or any other content.
            </p>
            <Input label="Example Input" placeholder="Type something..." />
            <div className="flex gap-3 pt-4">
              <Button className="flex-1">Submit</Button>
              <Button variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      </Card>

      {/* Typography */}
      <Card title="Typography">
        <div className="space-y-3">
          <div>
            <h1 className="text-[#0F172A]">Heading 1</h1>
            <p className="text-xs text-[#64748B]">32px, Medium</p>
          </div>
          <div>
            <h2 className="text-[#0F172A]">Heading 2</h2>
            <p className="text-xs text-[#64748B]">24px, Medium</p>
          </div>
          <div>
            <h3 className="text-[#0F172A]">Heading 3</h3>
            <p className="text-xs text-[#64748B]">20px, Medium</p>
          </div>
          <div>
            <h4 className="text-[#0F172A]">Heading 4</h4>
            <p className="text-xs text-[#64748B]">16px, Medium</p>
          </div>
          <div>
            <p className="text-[#0F172A]">Body Text - Regular paragraph text</p>
            <p className="text-xs text-[#64748B]">16px, Regular</p>
          </div>
          <div>
            <p className="text-sm text-[#64748B]">Small Text - Secondary information</p>
            <p className="text-xs text-[#64748B]">14px, Regular</p>
          </div>
        </div>
      </Card>

      {/* Colors */}
      <Card title="Color Palette">
        <div className="grid grid-cols-5 gap-4">
          <div>
            <div className="w-full h-20 bg-[#2563EB] rounded-lg mb-2"></div>
            <p className="text-sm text-[#0F172A]">Primary</p>
            <p className="text-xs text-[#64748B]">#2563EB</p>
          </div>
          <div>
            <div className="w-full h-20 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg mb-2"></div>
            <p className="text-sm text-[#0F172A]">Background</p>
            <p className="text-xs text-[#64748B]">#F8FAFC</p>
          </div>
          <div>
            <div className="w-full h-20 bg-white border border-[#E2E8F0] rounded-lg mb-2"></div>
            <p className="text-sm text-[#0F172A]">Card</p>
            <p className="text-xs text-[#64748B]">#FFFFFF</p>
          </div>
          <div>
            <div className="w-full h-20 bg-[#0F172A] rounded-lg mb-2"></div>
            <p className="text-sm text-[#0F172A]">Text Primary</p>
            <p className="text-xs text-[#64748B]">#0F172A</p>
          </div>
          <div>
            <div className="w-full h-20 bg-[#64748B] rounded-lg mb-2"></div>
            <p className="text-sm text-[#0F172A]">Text Secondary</p>
            <p className="text-xs text-[#64748B]">#64748B</p>
          </div>
        </div>
      </Card>

      {/* Badges/Tags */}
      <Card title="Badges & Status Tags">
        <div className="flex flex-wrap gap-3">
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">
            Available
          </span>
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs">
            Occupied
          </span>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
            Scheduled
          </span>
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
            Pending
          </span>
          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
            Completed
          </span>
        </div>
      </Card>

      {/* Form Example */}
      <Card title="Complete Form Example">
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" placeholder="Enter first name" required />
            <Input label="Last Name" placeholder="Enter last name" required />
          </div>
          <Input label="Email" type="email" placeholder="Enter email address" required />
          <Select
            label="Department"
            options={[
              { value: '', label: 'Select Department' },
              { value: 'cs', label: 'Computer Science' },
              { value: 'ec', label: 'Electronics' },
              { value: 'me', label: 'Mechanical' },
            ]}
            required
          />
          <div>
            <label className="block text-sm mb-2 text-[#0F172A]">Message</label>
            <textarea
              className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg bg-white text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
              rows={4}
              placeholder="Enter your message..."
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit" className="flex-1">Submit</Button>
            <Button type="button" variant="secondary" className="flex-1">Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
