import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';



const Dashboard = () => {
  const [estimates, setEstimates] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newEstimate, setNewEstimate] = useState({
    name: '',
    description: '',
    template_id: '',
    currency: 'USD',
    contingency_percentage: 15
  });

  useEffect(() => {
    fetchEstimates();
    fetchTemplates();
  }, []);

  const fetchEstimates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/estimates`);
      const data = await response.json();
      setEstimates(data);
    } catch (error) {
      console.error('Error fetching estimates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/templates`);
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const createEstimate = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/estimates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEstimate),
      });
      
      if (response.ok) {
        setIsCreateDialogOpen(false);
        setNewEstimate({
          name: '',
          description: '',
          template_id: '',
          currency: 'USD',
          contingency_percentage: 15
        });
        fetchEstimates();
      }
    } catch (error) {
      console.error('Error creating estimate:', error);
    }
  };

  const filteredEstimates = estimates.filter(estimate => {
    const matchesSearch = estimate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         estimate.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || estimate.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateTotalHours = (estimate) => {
    let totalHours = 0;
    estimate.phases?.forEach(phase => {
      phase.activities?.forEach(activity => {
        activity.tasks?.forEach(task => {
          totalHours += task.estimated_hours || 0;
        });
      });
    });
    return totalHours;
  };

  const calculateTotalCost = (estimate, totalHours) => {
    // Simplified calculation - in real app would use role assignments
    const avgCostRate = 125; // Average cost rate
    return totalHours * avgCostRate;
  };

  const calculateTotalRevenue = (estimate, totalHours) => {
    // Simplified calculation - in real app would use role assignments
    const avgBillRate = 250; // Average bill rate
    return totalHours * avgBillRate;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading estimates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Estimates</h1>
          <p className="text-gray-600 mt-1">Manage your project estimation templates and estimates</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>New Estimate</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Estimate</DialogTitle>
              <DialogDescription>
                Create a new project estimate from a template or start from scratch.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={newEstimate.name}
                  onChange={(e) => setNewEstimate({...newEstimate, name: e.target.value})}
                  placeholder="Enter project name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newEstimate.description}
                  onChange={(e) => setNewEstimate({...newEstimate, description: e.target.value})}
                  placeholder="Enter project description"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="template">Template</Label>
                <Select
                  value={newEstimate.template_id}
                  onValueChange={(value) => setNewEstimate({...newEstimate, template_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No template (blank estimate)</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={newEstimate.currency}
                    onValueChange={(value) => setNewEstimate({...newEstimate, currency: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contingency">Contingency %</Label>
                  <Input
                    id="contingency"
                    type="number"
                    value={newEstimate.contingency_percentage}
                    onChange={(e) => setNewEstimate({...newEstimate, contingency_percentage: parseFloat(e.target.value)})}
                    placeholder="15"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createEstimate} disabled={!newEstimate.name}>
                Create Estimate
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search estimates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Estimates Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredEstimates.map((estimate) => {
          const totalHours = calculateTotalHours(estimate);
          const totalCost = calculateTotalCost(estimate, totalHours);
          const totalRevenue = calculateTotalRevenue(estimate, totalHours);
          const agm = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue * 100) : 0;

          return (
            <Card key={estimate.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link to={`/estimator/${estimate.id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{estimate.name}</CardTitle>
                    <Badge className={getStatusColor(estimate.status)}>
                      {estimate.status}
                    </Badge>
                  </div>
                  <CardDescription>{estimate.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Total Hours:</span>
                      <span className="font-medium">{totalHours.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Revenue:</span>
                      <span className="font-medium text-green-600">
                        {estimate.currency} {totalRevenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">AGM:</span>
                      <span className={`font-medium ${agm >= 30 ? 'text-green-600' : agm >= 20 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {agm.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Updated:</span>
                      <span className="text-gray-500">
                        {new Date(estimate.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          );
        })}
      </div>

      {filteredEstimates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No estimates found</div>
          <p className="text-gray-400 mt-2">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first estimate to get started'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

