import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';



const GanttView = () => {
  const { id } = useParams();
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(true);

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
    } catch (error) {
      console.error('Error fetching estimate:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePhaseDuration = (phase) => {
    let totalHours = 0;
    phase.activities?.forEach(activity => {
      activity.tasks?.forEach(task => {
        totalHours += task.estimated_hours || 0;
      });
    });
    // Assuming 8 hours per day, 5 days per week
    return Math.ceil(totalHours / 40);
  };

  const generateGanttData = () => {
    if (!estimate) return [];
    
    let currentWeek = 0;
    const ganttData = [];
    
    estimate.phases?.forEach((phase, index) => {
      const duration = calculatePhaseDuration(phase);
      ganttData.push({
        id: phase.id,
        name: phase.name,
        type: 'phase',
        startWeek: currentWeek,
        duration: duration,
        endWeek: currentWeek + duration - 1,
        activities: []
      });
      
      let phaseCurrentWeek = currentWeek;
      phase.activities?.forEach(activity => {
        let activityHours = 0;
        activity.tasks?.forEach(task => {
          activityHours += task.estimated_hours || 0;
        });
        const activityDuration = Math.ceil(activityHours / 40);
        
        ganttData[ganttData.length - 1].activities.push({
          id: activity.id,
          name: activity.name,
          startWeek: phaseCurrentWeek,
          duration: activityDuration,
          endWeek: phaseCurrentWeek + activityDuration - 1
        });
        
        phaseCurrentWeek += Math.ceil(activityDuration / 2); // Overlap activities
      });
      
      currentWeek += duration;
    });
    
    return ganttData;
  };

  const renderGanttBar = (item, maxWeeks) => {
    const widthPercentage = (item.duration / maxWeeks) * 100;
    const leftPercentage = (item.startWeek / maxWeeks) * 100;
    
    return (
      <div
        className={`absolute h-6 rounded ${
          item.type === 'phase' ? 'bg-blue-500' : 'bg-green-400'
        } opacity-80`}
        style={{
          left: `${leftPercentage}%`,
          width: `${widthPercentage}%`
        }}
      >
        <div className="text-xs text-white px-2 py-1 truncate">
          {item.name}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading Gantt view...</div>
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

  const ganttData = generateGanttData();
  const maxWeeks = Math.max(...ganttData.map(phase => phase.endWeek)) + 1;
  const totalDuration = Math.ceil(maxWeeks / 4.33); // Convert weeks to months

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gantt Timeline</h1>
          <p className="text-gray-600 mt-1">{estimate.name}</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{maxWeeks} weeks</span>
          </Badge>
          <Badge variant="outline" className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{totalDuration.toFixed(1)} months</span>
          </Badge>
        </div>
      </div>

      {/* Gantt Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project Timeline</CardTitle>
          <CardDescription>Visual representation of project phases and activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Timeline Header */}
            <div className="relative">
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                {Array.from({ length: Math.ceil(maxWeeks / 4) }, (_, i) => (
                  <div key={i} className="text-center">
                    Month {i + 1}
                  </div>
                ))}
              </div>
              <div className="h-px bg-gray-200"></div>
            </div>

            {/* Gantt Bars */}
            <div className="space-y-8">
              {ganttData.map((phase) => (
                <div key={phase.id} className="space-y-3">
                  {/* Phase Bar */}
                  <div className="relative">
                    <div className="flex items-center mb-2">
                      <div className="w-48 text-sm font-medium text-gray-900 truncate">
                        {phase.name}
                      </div>
                      <div className="flex-1 relative h-8 bg-gray-100 rounded">
                        {renderGanttBar(phase, maxWeeks)}
                      </div>
                      <div className="w-20 text-right text-sm text-gray-500">
                        {phase.duration}w
                      </div>
                    </div>
                  </div>

                  {/* Activity Bars */}
                  <div className="ml-4 space-y-2">
                    {phase.activities.map((activity) => (
                      <div key={activity.id} className="relative">
                        <div className="flex items-center">
                          <div className="w-44 text-xs text-gray-600 truncate">
                            {activity.name}
                          </div>
                          <div className="flex-1 relative h-6 bg-gray-50 rounded">
                            {renderGanttBar(activity, maxWeeks)}
                          </div>
                          <div className="w-20 text-right text-xs text-gray-400">
                            {activity.duration}w
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ganttData.map((phase) => (
          <Card key={phase.id}>
            <CardHeader>
              <CardTitle className="text-lg">{phase.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{phase.duration} weeks</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Activities:</span>
                  <span className="font-medium">{phase.activities.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Start:</span>
                  <span className="font-medium">Week {phase.startWeek + 1}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">End:</span>
                  <span className="font-medium">Week {phase.endWeek + 1}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Critical Path Notice */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <ArrowRight className="h-5 w-5 text-yellow-600" />
            <div>
              <div className="font-medium text-yellow-800">Critical Path Analysis</div>
              <div className="text-sm text-yellow-700">
                This is a simplified timeline view. In a full implementation, critical path analysis 
                would highlight dependencies and identify bottlenecks.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GanttView;

