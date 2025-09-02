import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { PlusIcon, SearchIcon, FilterIcon, CheckCircleIcon, ClockIcon, AlertCircleIcon } from 'lucide-react';
import { toast } from 'sonner';
const Tickets: React.FC = () => {
  const {
    user
  } = useAuth();
  const {
    assets,
    tickets,
    users,
    addTicket,
    updateTicketStatus
  } = useData();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(false); // ⭐ NEW STATE

  // Form state
  const [formData, setFormData] = useState({
    serialNo: '',
    description: ''
  });
 
  // Filter assets assigned to the current employee (by empId, with type guards)
  const userAssets = user?.role === 'employee'
    ? assets.filter(asset => {
        const assignedUserId = (asset as any).assignedTo || '';
        const empId = (user as any).empId || '';
        return assignedUserId === empId;
      })
    : [];
  // Apply search and filters
  const filteredTickets = tickets.filter(ticket => {
    const asset = assets.find(a => a.serialNumber === ticket.serialNo);
    console.log("asset",ticket);
    const ticketUser = users.find(u => u.empId === ticket.empId);
    console.log("ticketUser",ticketUser);
    const matchesSearch = search === '' || asset?.name.toLowerCase().includes(search.toLowerCase()) || ticketUser?.empId.toLowerCase().includes(search.toLowerCase());
    console.log("matchesSearch",matchesSearch);
    const matchesStatus = statusFilter === '' || ticket.status === statusFilter;
    console.log("matchesStatus",matchesStatus);
    // For employees, only show their own tickets
    if (user?.role === 'employee') {
      return ticket.empId === user.empId && matchesSearch && matchesStatus;
    }
    return matchesSearch && matchesStatus;
  });
  console.log("filteredTickets",filteredTickets);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const {
      name,
      value
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
       setLoading(true); // ⭐ Start loading
      // Map form data to backend API fields
      await addTicket({
            serialNo: formData.serialNo,
            description: formData.description,
            empId: user.id,
            status: 'Open'
      });
      
      setFormData({
        serialNo: '',
        description: '',
      });
      setShowForm(false);
    } catch (error) {
      toast.error('Failed to submit ticket');
    }
    finally{
      setLoading(false);
    }
  };
  const handleStatusChange = async (ticketId: string, newStatus: 'Open' | 'In Progress' | 'Resolved') => {
    try {
      await updateTicketStatus(ticketId, newStatus);
      toast.success(`Ticket status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update ticket status');
    }
  };

  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Ticket Management</h1>
        {user?.role === 'employee' && <button onClick={() => setShowForm(!showForm)} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center">
            <PlusIcon className="w-5 h-5 mr-1" />
            {showForm ? 'Cancel' : 'Raise Ticket'}
          </button>}
      </div>
      {showForm && <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Raise New Ticket</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Asset*
              </label>
              <select name="serialNo" value={formData.serialNo} onChange={handleInputChange} required className="w-full p-2 border rounded-md">
                <option value="">Select an asset</option>
                {userAssets.map(asset => (
                  <option key={asset.id} value={asset.serialNumber}>
                    {asset.name} (TAG: {(asset as any).tagNo || (asset as any).tagNo || ''})
                  </option>
                ))}
              </select>
              {userAssets.length === 0 && <p className="mt-1 text-sm text-red-500">
                  You don't have any assigned assets. Please contact an
                  administrator.
                </p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Issue Description*
              </label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} required rows={4} className="w-full p-2 border rounded-md" placeholder="Please describe the issue in detail..." />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                disabled={loading} // ⭐ Disable when loading
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={userAssets.length === 0 || loading} // ⭐ Disable when loading
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" fill="none" />
                      <path
                        className="opacity-75"
                        fill="white"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Submit Ticket'
                )}
              </button>
            </div>
          </form>
        </div>}
      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input type="text" placeholder="Search tickets" value={search} onChange={e => setSearch(e.target.value)} className="pl-10 p-2 border rounded-md w-full" />
          </div>
          <div className="flex items-center space-x-2">
            <FilterIcon className="h-5 w-5 text-gray-400" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="p-2 border rounded-md">
              <option value="">All Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>
      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.length > 0 ? filteredTickets.map(ticket => {
        const asset = assets.find(a => a.serialNumber === ticket.serialNo);
        const ticketUser = users.find(u => u.empId === ticket.empId);
        let statusIcon;
        let statusColor;
        if (ticket.status === 'Open') {
          statusIcon = <AlertCircleIcon className="h-5 w-5 text-red-500" />;
          statusColor = 'text-red-500 bg-red-50';
        } else if (ticket.status === 'In Progress') {
          statusIcon = <ClockIcon className="h-5 w-5 text-yellow-500" />;
          statusColor = 'text-yellow-500 bg-yellow-50';
        } else {
          statusIcon = <CheckCircleIcon className="h-5 w-5 text-green-500" />;
          statusColor = 'text-green-500 bg-green-50';
        }
        return <div key={ticket.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="flex items-start space-x-3">
                    {statusIcon}
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {asset?.name || 'Unknown Asset'} -{' '}
                        {asset?.tagNo || 'N/A'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Reported by: {ticketUser?.empId || 'Unknown'} •{' '}
                        {new Date(ticket.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className={`mt-2 md:mt-0 px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
                    {ticket.status}
                  </div>
                </div>
                <div className="mt-4 text-gray-700">{ticket.description}</div>
                {user?.role === 'admin' && <div className="mt-4 pt-4 border-t flex justify-end space-x-2">
                    {ticket.status !== 'Open' && <button onClick={() => handleStatusChange(ticket.id, 'Open')} className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm">
                        Mark as Open
                      </button>}
                    {ticket.status !== 'In Progress' && <button onClick={() => handleStatusChange(ticket.id, 'In Progress')} className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-md text-sm">
                        Mark as In Progress
                      </button>}
                    {ticket.status !== 'Resolved' && <button onClick={() => handleStatusChange(ticket.id, 'Resolved')} className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm">
                        Mark as Resolved
                      </button>}
                  </div>}
              </div>;
      }) : <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No tickets found</p>
          </div>}
      </div>
    </div>;
};
export default Tickets;