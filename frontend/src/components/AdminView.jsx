import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Save, X, Trash2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const API_BASE_URL = 'http://localhost:5000/api';

const AdminView = () => {
  const [roleData, setRoleData] = useState([]);
  const [complexityMatrix, setComplexityMatrix] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState(null);
  const [editingMatrix, setEditingMatrix] = useState(null);
  const [isCreateRoleDialogOpen, setIsCreateRoleDialogOpen] = useState(false);
  const [isCreateMatrixDialogOpen, setIsCreateMatrixDialogOpen] = useState(false);
  
  const [newRole, setNewRole] = useState({
    name: '',
    level: '',
    default_bill_rate: '',
    default_cost_rate: ''
  });

  const [newMatrix, setNewMatrix] = useState({
    role_level_id: '',
    complexity: '',
    hours_per_story_point: ''
  });

  const [editValues, setEditValues] = useState({});

  useEffect(() => {
    fetchRoleData();
    fetchComplexityMatrix();
  }, []);

  const fetchRoleData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/role-levels`);
      const data = await response.json();
      setRoleData(data);
    } catch (error) {
      console.error('Error fetching role data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComplexityMatrix = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/complexity-matrix`);
      const data = await response.json();
      setComplexityMatrix(data);
    } catch (error) {
      console.error('Error fetching complexity matrix:', error);
    }
  };

  const createRole = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/role-levels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newRole,
          default_bill_rate: parseFloat(newRole.default_bill_rate),
          default_cost_rate: parseFloat(newRole.default_cost_rate)
        }),
      });
      
      if (response.ok) {
        setIsCreateRoleDialogOpen(false);
        setNewRole({
          name: '',
          level: '',
          default_bill_rate: '',
          default_cost_rate: ''
        });
        fetchRoleData();
      }
    } catch (error) {
      console.error('Error creating role:', error);
    }
  };

  const createMatrixEntry = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/complexity-matrix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newMatrix,
          role_level_id: parseInt(newMatrix.role_level_id),
          hours_per_story_point: parseFloat(newMatrix.hours_per_story_point)
        }),
      });
      
      if (response.ok) {
        setIsCreateMatrixDialogOpen(false);
        setNewMatrix({
          role_level_id: '',
          complexity: '',
          hours_per_story_point: ''
        });
        fetchComplexityMatrix();
      }
    } catch (error) {
      console.error('Error creating matrix entry:', error);
    }
  };

  const startEditingRole = (role) => {
    setEditingRole(role.id);
    setEditValues({
      name: role.name,
      level: role.level,
      default_bill_rate: role.default_bill_rate,
      default_cost_rate: role.default_cost_rate
    });
  };

  const startEditingMatrix = (entry) => {
    setEditingMatrix(entry.id);
    setEditValues({
      complexity: entry.complexity,
      hours_per_story_point: entry.hours_per_story_point
    });
  };

  const saveRoleEdit = async () => {
    try {
      // Note: This would need a PUT endpoint for role-levels in the backend
      console.log('Saving role edit:', editValues);
      setEditingRole(null);
      setEditValues({});
      // fetchRoleData(); // Uncomment when backend supports role updates
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const saveMatrixEdit = async () => {
    try {
      // Note: This would need a PUT endpoint for complexity-matrix in the backend
      console.log('Saving matrix edit:', editValues);
      setEditingMatrix(null);
      setEditValues({});
      // fetchComplexityMatrix(); // Uncomment when backend supports matrix updates
    } catch (error) {
      console.error('Error updating matrix entry:', error);
    }
  };

  const cancelEdit = () => {
    setEditingRole(null);
    setEditingMatrix(null);
    setEditValues({});
  };

  const getMarginColor = (billRate, costRate) => {
    const margin = ((billRate - costRate) / billRate) * 100;
    if (margin >= 50) return 'text-green-600';
    if (margin >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getLevelColor = (level) => {
    switch (level.toLowerCase()) {
      case 'junior': return 'bg-blue-100 text-blue-800';
      case 'mid': return 'bg-green-100 text-green-800';
      case 'senior': return 'bg-purple-100 text-purple-800';
      case 'principal': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplexityColor = (complexity) => {
    switch (complexity.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
          <p className="text-gray-600 mt-1">Manage role levels, rates, and complexity matrix</p>
        </div>
        <div className="flex items-center space-x-2">
          <Settings className="h-5 w-5 text-gray-500" />
        </div>
      </div>

      <Tabs defaultValue="roles" className="space-y-6">
        <TabsList>
          <TabsTrigger value="roles">Role Levels</TabsTrigger>
          <TabsTrigger value="complexity">Complexity Matrix</TabsTrigger>
        </TabsList>

        {/* Role Levels Tab */}
        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Role Levels & Rates</CardTitle>
                  <CardDescription>Manage role definitions and default billing rates</CardDescription>
                </div>
                <Dialog open={isCreateRoleDialogOpen} onOpenChange={setIsCreateRoleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center space-x-2">
                      <Plus className="h-4 w-4" />
                      <span>Add Role</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Create New Role Level</DialogTitle>
                      <DialogDescription>
                        Add a new role level with default billing and cost rates.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="role-name">Role Name</Label>
                        <Input
                          id="role-name"
                          value={newRole.name}
                          onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                          placeholder="e.g., Functional Consultant"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="role-level">Level</Label>
                        <Select
                          value={newRole.level}
                          onValueChange={(value) => setNewRole({...newRole, level: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Junior">Junior</SelectItem>
                            <SelectItem value="Mid">Mid</SelectItem>
                            <SelectItem value="Senior">Senior</SelectItem>
                            <SelectItem value="Principal">Principal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="bill-rate">Bill Rate ($/hr)</Label>
                          <Input
                            id="bill-rate"
                            type="number"
                            value={newRole.default_bill_rate}
                            onChange={(e) => setNewRole({...newRole, default_bill_rate: e.target.value})}
                            placeholder="250"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="cost-rate">Cost Rate ($/hr)</Label>
                          <Input
                            id="cost-rate"
                            type="number"
                            value={newRole.default_cost_rate}
                            onChange={(e) => setNewRole({...newRole, default_cost_rate: e.target.value})}
                            placeholder="125"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsCreateRoleDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createRole} disabled={!newRole.name || !newRole.level}>
                        Create Role
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Role</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Level</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Bill Rate</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Cost Rate</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Margin</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roleData.map((role) => {
                      const margin = ((role.default_bill_rate - role.default_cost_rate) / role.default_bill_rate * 100);
                      return (
                        <tr key={role.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-3 py-2 text-sm">
                            {editingRole === role.id ? (
                              <Input
                                value={editValues.name}
                                onChange={(e) => setEditValues({...editValues, name: e.target.value})}
                                className="h-8"
                              />
                            ) : (
                              role.name
                            )}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">
                            {editingRole === role.id ? (
                              <Select
                                value={editValues.level}
                                onValueChange={(value) => setEditValues({...editValues, level: value})}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Junior">Junior</SelectItem>
                                  <SelectItem value="Mid">Mid</SelectItem>
                                  <SelectItem value="Senior">Senior</SelectItem>
                                  <SelectItem value="Principal">Principal</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge className={getLevelColor(role.level)}>
                                {role.level}
                              </Badge>
                            )}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">
                            {editingRole === role.id ? (
                              <Input
                                type="number"
                                value={editValues.default_bill_rate}
                                onChange={(e) => setEditValues({...editValues, default_bill_rate: parseFloat(e.target.value)})}
                                className="h-8 w-20"
                              />
                            ) : (
                              `$${role.default_bill_rate}/hr`
                            )}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">
                            {editingRole === role.id ? (
                              <Input
                                type="number"
                                value={editValues.default_cost_rate}
                                onChange={(e) => setEditValues({...editValues, default_cost_rate: parseFloat(e.target.value)})}
                                className="h-8 w-20"
                              />
                            ) : (
                              `$${role.default_cost_rate}/hr`
                            )}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">
                            <span className={`font-medium ${getMarginColor(role.default_bill_rate, role.default_cost_rate)}`}>
                              {margin.toFixed(1)}%
                            </span>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">
                            {editingRole === role.id ? (
                              <div className="flex space-x-1">
                                <Button size="sm" variant="outline" onClick={saveRoleEdit}>
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={cancelEdit}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => startEditingRole(role)}>
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Complexity Matrix Tab */}
        <TabsContent value="complexity" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Complexity Matrix</CardTitle>
                  <CardDescription>Define hours per story point by role and complexity level</CardDescription>
                </div>
                <Dialog open={isCreateMatrixDialogOpen} onOpenChange={setIsCreateMatrixDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center space-x-2">
                      <Plus className="h-4 w-4" />
                      <span>Add Entry</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Create Matrix Entry</DialogTitle>
                      <DialogDescription>
                        Add a new complexity matrix entry for a role and complexity level.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="matrix-role">Role Level</Label>
                        <Select
                          value={newMatrix.role_level_id}
                          onValueChange={(value) => setNewMatrix({...newMatrix, role_level_id: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role level" />
                          </SelectTrigger>
                          <SelectContent>
                            {roleData.map((role) => (
                              <SelectItem key={role.id} value={role.id.toString()}>
                                {role.name} - {role.level}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="matrix-complexity">Complexity</Label>
                        <Select
                          value={newMatrix.complexity}
                          onValueChange={(value) => setNewMatrix({...newMatrix, complexity: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select complexity" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="matrix-hours">Hours per Story Point</Label>
                        <Input
                          id="matrix-hours"
                          type="number"
                          value={newMatrix.hours_per_story_point}
                          onChange={(e) => setNewMatrix({...newMatrix, hours_per_story_point: e.target.value})}
                          placeholder="8"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsCreateMatrixDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createMatrixEntry} disabled={!newMatrix.role_level_id || !newMatrix.complexity}>
                        Create Entry
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Role</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Level</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Complexity</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Hours/SP</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complexityMatrix.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-3 py-2 text-sm">
                          {entry.role_level?.name || 'Unknown Role'}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">
                          <Badge className={getLevelColor(entry.role_level?.level || '')}>
                            {entry.role_level?.level || 'Unknown'}
                          </Badge>
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">
                          {editingMatrix === entry.id ? (
                            <Select
                              value={editValues.complexity}
                              onValueChange={(value) => setEditValues({...editValues, complexity: value})}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Low">Low</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="High">High</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge className={getComplexityColor(entry.complexity)}>
                              {entry.complexity}
                            </Badge>
                          )}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">
                          {editingMatrix === entry.id ? (
                            <Input
                              type="number"
                              value={editValues.hours_per_story_point}
                              onChange={(e) => setEditValues({...editValues, hours_per_story_point: parseFloat(e.target.value)})}
                              className="h-8 w-20"
                            />
                          ) : (
                            `${entry.hours_per_story_point} hrs`
                          )}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">
                          {editingMatrix === entry.id ? (
                            <div className="flex space-x-1">
                              <Button size="sm" variant="outline" onClick={saveMatrixEdit}>
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={cancelEdit}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => startEditingMatrix(entry)}>
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminView;

