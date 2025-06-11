import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronRight, ChevronDown, Edit2, Save, X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';

const API_BASE_URL = 'http://localhost:5000/api';

const EstimatorCanvas = () => {
  const { id } = useParams();
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [editingTask, setEditingTask] = useState(null);
  const [editValues, setEditValues] = useState({});

  useEffect(() => {
    if (id) {
      fetchEstimate(id);
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchEstimate = async (estimateId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/estimates/${estimateId}`);
      const data = await response.json();
      setEstimate(data);
      
      // Auto-expand first level
      const firstLevelIds = new Set();
      data.phases?.forEach(phase => {
        firstLevelIds.add(`phase-${phase.id}`);
      });
      setExpandedItems(firstLevelIds);
    } catch (error) {
      console.error('Error fetching estimate:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (itemId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const startEditingTask = (task) => {
    setEditingTask(task.id);
    setEditValues({
      name: task.name,
      complexity: task.complexity,
      story_points: task.story_points,
      estimated_hours: task.estimated_hours
    });
  };

  const saveTaskEdit = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${editingTask}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editValues),
      });
      
      if (response.ok) {
        setEditingTask(null);
        setEditValues({});
        fetchEstimate(id);
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setEditValues({});
  };

  const updateContingency = async (newPercentage) => {
    try {
      const response = await fetch(`${API_BASE_URL}/estimates/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contingency_percentage: newPercentage }),
      });
      
      if (response.ok) {
        setEstimate(prev => ({
          ...prev,
          contingency_percentage: newPercentage
        }));
      }
    } catch (error) {
      console.error('Error updating contingency:', error);
    }
  };

  const calculateTotals = () => {
    if (!estimate) return { totalHours: 0, totalCost: 0, totalRevenue: 0, agm: 0 };
    
    let totalHours = 0;
    estimate.phases?.forEach(phase => {
      phase.activities?.forEach(activity => {
        activity.tasks?.forEach(task => {
          totalHours += task.estimated_hours || 0;
        });
      });
    });

    // Apply contingency
    const contingencyMultiplier = 1 + (estimate.contingency_percentage || 0) / 100;
    const adjustedHours = totalHours * contingencyMultiplier;
    
    // Simplified calculation - in real app would use role assignments
    const avgCostRate = 125;
    const avgBillRate = 250;
    const totalCost = adjustedHours * avgCostRate;
    const totalRevenue = adjustedHours * avgBillRate;
    const agm = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue * 100) : 0;

    return { totalHours: adjustedHours, totalCost, totalRevenue, agm };
  };

  const renderTreeItem = (item, type, level = 0) => {
    const itemId = `${type}-${item.id}`;
    const isExpanded = expandedItems.has(itemId);
    const hasChildren = (type === 'phase' && item.activities?.length > 0) || 
                       (type === 'activity' && item.tasks?.length > 0);

    return (
      <div key={itemId} className="select-none">
        <div 
          className={`flex items-center py-2 px-3 hover:bg-gray-50 cursor-pointer border-l-2 ${
            type === 'phase' ? 'border-blue-500 bg-blue-50' :
            type === 'activity' ? 'border-green-500 bg-green-50' :
            'border-gray-300'
          }`}
          style={{ marginLeft: `${level * 20}px` }}
          onClick={() => hasChildren && toggleExpanded(itemId)}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />
          ) : (
            <div className="w-4 mr-2" />
          )}
          
          <div className="flex-1">
            <div className="font-medium text-sm">{item.name}</div>
            {item.description && (
              <div className="text-xs text-gray-500">{item.description}</div>
            )}
          </div>
          
          {type === 'task' && (
            <div className="flex items-center space-x-2 ml-4">
              <Badge variant="outline" className="text-xs">
                {item.complexity || 'Medium'}
              </Badge>
              <span className="text-xs text-gray-500">
                {item.story_points || 1} SP
              </span>
              <span className="text-xs font-medium">
                {item.estimated_hours || 0}h
              </span>
            </div>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div>
            {type === 'phase' && item.activities?.map(activity => 
              renderTreeItem(activity, 'activity', level + 1)
            )}
            {type === 'activity' && item.tasks?.map(task => 
              renderTreeItem(task, 'task', level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  const renderTaskGrid = () => {
    if (!estimate) return null;

    const allTasks = [];
    estimate.phases?.forEach(phase => {
      phase.activities?.forEach(activity => {
        activity.tasks?.forEach(task => {
          allTasks.push({
            ...task,
            phaseName: phase.name,
            activityName: activity.name
          });
        });
      });
    });

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Phase</th>
              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Activity</th>
              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Task</th>
              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Complexity</th>
              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Story Points</th>
              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Hours</th>
              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {allTasks.map((task) => (
              <tr key={task.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-3 py-2 text-sm">{task.phaseName}</td>
                <td className="border border-gray-300 px-3 py-2 text-sm">{task.activityName}</td>
                <td className="border border-gray-300 px-3 py-2 text-sm">
                  {editingTask === task.id ? (
                    <Input
                      value={editValues.name}
                      onChange={(e) => setEditValues({...editValues, name: e.target.value})}
                      className="h-8"
                    />
                  ) : (
                    task.name
                  )}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-sm">
                  {editingTask === task.id ? (
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
                    <Badge variant="outline">{task.complexity || 'Medium'}</Badge>
                  )}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-sm">
                  {editingTask === task.id ? (
                    <Input
                      type="number"
                      value={editValues.story_points}
                      onChange={(e) => setEditValues({...editValues, story_points: parseInt(e.target.value)})}
                      className="h-8 w-20"
                    />
                  ) : (
                    task.story_points || 1
                  )}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-sm">
                  {editingTask === task.id ? (
                    <Input
                      type="number"
                      step="0.5"
                      value={editValues.estimated_hours}
                      onChange={(e) => setEditValues({...editValues, estimated_hours: parseFloat(e.target.value)})}
                      className="h-8 w-20"
                    />
                  ) : (
                    task.estimated_hours || 0
                  )}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-sm">
                  {editingTask === task.id ? (
                    <div className="flex space-x-1">
                      <Button size="sm" variant="outline" onClick={saveTaskEdit}>
                        <Save className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => startEditingTask(task)}>
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading estimate...</div>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">No estimate selected</div>
        <p className="text-gray-400 mt-2">Please select an estimate from the dashboard</p>
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{estimate.name}</h1>
          <p className="text-gray-600 mt-1">{estimate.description}</p>
        </div>
        <Badge className={estimate.status === 'draft' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'}>
          {estimate.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tree View */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Structure</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {estimate.phases?.map(phase => renderTreeItem(phase, 'phase'))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Task Details</CardTitle>
              <CardDescription>Edit task complexity, story points, and estimated hours</CardDescription>
            </CardHeader>
            <CardContent>
              {renderTaskGrid()}
            </CardContent>
          </Card>
        </div>

        {/* KPI Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Totals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-gray-600">Total Hours</div>
                <div className="text-2xl font-bold">{totals.totalHours.toLocaleString()}</div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600">Total Cost</div>
                <div className="text-2xl font-bold text-red-600">
                  {estimate.currency} {totals.totalCost.toLocaleString()}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600">Total Revenue</div>
                <div className="text-2xl font-bold text-green-600">
                  {estimate.currency} {totals.totalRevenue.toLocaleString()}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600">Adjusted Gross Margin</div>
                <div className={`text-2xl font-bold ${
                  totals.agm >= 30 ? 'text-green-600' : 
                  totals.agm >= 20 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {totals.agm.toFixed(1)}%
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contingency</CardTitle>
              <CardDescription>Adjust project contingency percentage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <span className="text-2xl font-bold">{estimate.contingency_percentage || 0}%</span>
                </div>
                <Slider
                  value={[estimate.contingency_percentage || 0]}
                  onValueChange={(value) => updateContingency(value[0])}
                  max={50}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0%</span>
                  <span>50%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EstimatorCanvas;

