import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Users, Download, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const API_BASE_URL = 'http://localhost:5000/api';

const StaffingView = () => {
  const { id } = useParams();
  const [estimate, setEstimate] = useState(null);
  const [roleData, setRoleData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchEstimate(id);
    } else {
      setLoading(false);
    }
    fetchRoleData();
  }, [id]);

  const fetchEstimate = async (estimateId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/estimates/${estimateId}`);
      const data = await response.json();
      setEstimate(data);
    } catch (error) {
      console.error('Error fetching estimate:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoleData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/role-levels`);
      const data = await response.json();
      setRoleData(data);
    } catch (error) {
      console.error('Error fetching role data:', error);
    }
  };

  const calculateStaffingRequirements = () => {
    if (!estimate) return [];

    const staffingData = [];
    const totalWeeks = 78; // 18 months * 4.33 weeks/month
    const weeksPerPhase = Math.ceil(totalWeeks / (estimate.phases?.length || 1));

    // Group role levels by role name
    const roleGroups = roleData.reduce((acc, role) => {
      if (!acc[role.name]) {
        acc[role.name] = [];
      }
      acc[role.name].push(role);
      return acc;
    }, {});

    Object.entries(roleGroups).forEach(([roleName, roles]) => {
      let totalHours = 0;
      
      // Calculate total hours for this role across all tasks
      estimate.phases?.forEach(phase => {
        phase.activities?.forEach(activity => {
          activity.tasks?.forEach(task => {
            // Simplified: assume each task needs this role type
            if (roleName.includes('Functional') && task.complexity !== 'High') {
              totalHours += task.estimated_hours || 0;
            } else if (roleName.includes('Technical') && task.complexity === 'High') {
              totalHours += task.estimated_hours || 0;
            } else if (roleName.includes('Project Manager')) {
              totalHours += (task.estimated_hours || 0) * 0.2; // 20% PM overhead
            } else if (roleName.includes('Solution Architect')) {
              totalHours += (task.estimated_hours || 0) * 0.1; // 10% architect oversight
            }
          });
        });
      });

      if (totalHours > 0) {
        const hoursPerWeek = totalHours / totalWeeks;
        const fteRequired = hoursPerWeek / 40; // 40 hours per week = 1 FTE
        
        staffingData.push({
          roleName,
          roles,
          totalHours,
          fteRequired,
          hoursPerWeek,
          status: fteRequired > 1 ? 'high' : fteRequired > 0.5 ? 'medium' : 'low'
        });
      }
    });

    return staffingData.sort((a, b) => b.fteRequired - a.fteRequired);
  };

  const generateWeeklyHeatmap = (staffingData) => {
    const weeks = Array.from({ length: 20 }, (_, i) => i + 1); // Show first 20 weeks
    const heatmapData = [];

    staffingData.forEach(role => {
      const weeklyData = weeks.map(week => {
        // Simulate varying demand throughout project
        let demandMultiplier = 1;
        if (week <= 4) demandMultiplier = 0.5; // Ramp up
        else if (week <= 12) demandMultiplier = 1.2; // Peak
        else if (week <= 16) demandMultiplier = 1.0; // Steady
        else demandMultiplier = 0.7; // Wind down

        const weeklyFTE = role.fteRequired * demandMultiplier;
        return {
          week,
          fte: weeklyFTE,
          status: weeklyFTE > 1.5 ? 'overloaded' : weeklyFTE > 1 ? 'high' : weeklyFTE > 0.5 ? 'medium' : 'low'
        };
      });

      heatmapData.push({
        ...role,
        weeklyData
      });
    });

    return heatmapData;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'overloaded': return 'bg-red-500';
      case 'high': return 'bg-orange-400';
      case 'medium': return 'bg-yellow-400';
      case 'low': return 'bg-green-400';
      default: return 'bg-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'overloaded': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return null;
    }
  };

  const exportToCSV = () => {
    const staffingData = calculateStaffingRequirements();
    const heatmapData = generateWeeklyHeatmap(staffingData);
    
    let csvContent = "Role,Total Hours,FTE Required,Status\n";
    staffingData.forEach(role => {
      csvContent += `"${role.roleName}",${role.totalHours},${role.fteRequired.toFixed(2)},${role.status}\n`;
    });
    
    csvContent += "\n\nWeekly Staffing Heatmap\n";
    csvContent += "Role," + Array.from({ length: 20 }, (_, i) => `Week ${i + 1}`).join(",") + "\n";
    
    heatmapData.forEach(role => {
      csvContent += `"${role.roleName}",` + role.weeklyData.map(w => w.fte.toFixed(2)).join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `staffing-plan-${estimate?.name || 'estimate'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading staffing view...</div>
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

  const staffingData = calculateStaffingRequirements();
  const heatmapData = generateWeeklyHeatmap(staffingData);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staffing Plan</h1>
          <p className="text-gray-600 mt-1">{estimate.name}</p>
        </div>
        <Button onClick={exportToCSV} className="flex items-center space-x-2">
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </Button>
      </div>

      {/* Staffing Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {staffingData.map((role) => (
          <Card key={role.roleName}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{role.roleName}</CardTitle>
                {getStatusIcon(role.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{role.fteRequired.toFixed(1)} FTE</div>
                <div className="text-sm text-gray-600">
                  {role.totalHours.toLocaleString()} total hours
                </div>
                <div className="text-sm text-gray-600">
                  {role.hoursPerWeek.toFixed(1)} hours/week
                </div>
                <Badge variant="outline" className={`${
                  role.status === 'high' ? 'border-red-200 text-red-700' :
                  role.status === 'medium' ? 'border-yellow-200 text-yellow-700' :
                  'border-green-200 text-green-700'
                }`}>
                  {role.status} demand
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Staffing Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Weekly Staffing Heatmap</span>
          </CardTitle>
          <CardDescription>
            Resource allocation across the first 20 weeks of the project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header */}
              <div className="grid grid-cols-21 gap-1 mb-2">
                <div className="text-sm font-medium text-gray-700">Role</div>
                {Array.from({ length: 20 }, (_, i) => (
                  <div key={i} className="text-xs text-center text-gray-500">
                    W{i + 1}
                  </div>
                ))}
              </div>

              {/* Heatmap Rows */}
              <div className="space-y-2">
                {heatmapData.map((role) => (
                  <div key={role.roleName} className="grid grid-cols-21 gap-1 items-center">
                    <div className="text-sm font-medium text-gray-900 truncate pr-2">
                      {role.roleName}
                    </div>
                    {role.weeklyData.map((week) => (
                      <div
                        key={week.week}
                        className={`h-8 rounded text-xs flex items-center justify-center text-white font-medium ${getStatusColor(week.status)}`}
                        title={`Week ${week.week}: ${week.fte.toFixed(2)} FTE`}
                      >
                        {week.fte.toFixed(1)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-6 flex items-center space-x-6">
                <div className="text-sm font-medium text-gray-700">Legend:</div>
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-4 bg-green-400 rounded"></div>
                  <span className="text-xs">Low (≤0.5 FTE)</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                  <span className="text-xs">Medium (0.5-1 FTE)</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-4 bg-orange-400 rounded"></div>
                  <span className="text-xs">High (1-1.5 FTE)</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-xs">Overloaded (&gt;1.5 FTE)</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Role Level Details</CardTitle>
          <CardDescription>Available role levels and their rates</CardDescription>
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
                </tr>
              </thead>
              <tbody>
                {roleData.map((role) => {
                  const margin = ((role.default_bill_rate - role.default_cost_rate) / role.default_bill_rate * 100);
                  return (
                    <tr key={role.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-3 py-2 text-sm">{role.name}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm">
                        <Badge variant="outline">{role.level}</Badge>
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-sm font-medium">
                        ${role.default_bill_rate}/hr
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-sm">
                        ${role.default_cost_rate}/hr
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-sm">
                        <span className={`font-medium ${margin >= 50 ? 'text-green-600' : margin >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {margin.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffingView;

