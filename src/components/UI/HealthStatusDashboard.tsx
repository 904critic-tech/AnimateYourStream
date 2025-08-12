import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, XCircle, Clock, Zap, Wifi, HardDrive } from 'lucide-react';
import { getHealthCheck, HealthStatus, ServiceHealth } from '../../utils/healthCheck';

interface HealthStatusDashboardProps {
  compact?: boolean;
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const HealthStatusDashboard: React.FC<HealthStatusDashboardProps> = ({
  compact = false,
  className = '',
  autoRefresh = true,
  refreshInterval = 30000
}) => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const updateHealthStatus = async () => {
      const healthCheck = getHealthCheck();
      if (healthCheck) {
        setIsLoading(true);
        try {
          const status = await healthCheck.forceCheck();
          setHealthStatus(status);
          setLastUpdate(new Date());
        } catch (error) {
          console.error('Failed to get health status:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    // Initial load
    updateHealthStatus();

    // Auto-refresh
    let intervalId: number | undefined;
    if (autoRefresh) {
      intervalId = window.setInterval(updateHealthStatus, refreshInterval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, refreshInterval]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'degraded':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'unhealthy':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'border-green-500/20 bg-green-500/10';
      case 'degraded':
        return 'border-yellow-500/20 bg-yellow-500/10';
      case 'unhealthy':
        return 'border-red-500/20 bg-red-500/10';
      default:
        return 'border-gray-500/20 bg-gray-500/10';
    }
  };

  const formatUptime = (uptime: number) => {
    const minutes = Math.floor(uptime / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="bg-secondary-800 rounded-lg border border-secondary-700 p-4">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
            <span className="text-secondary-300 text-sm">Checking system health...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!healthStatus) {
    return (
      <div className={`${className}`}>
        <div className="bg-secondary-800 rounded-lg border border-red-500/20 p-4">
          <div className="flex items-center space-x-2">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-sm">Health monitoring unavailable</span>
          </div>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`${className}`}>
        <div className={`rounded-lg border p-3 ${getStatusColor(healthStatus.status)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon(healthStatus.status)}
              <span className="font-medium text-white text-sm capitalize">
                {healthStatus.status}
              </span>
            </div>
            <div className="text-xs text-secondary-400">
              {healthStatus.overallScore}/100
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="bg-secondary-800 rounded-xl border border-secondary-700 overflow-hidden">
        {/* Header */}
        <div className={`p-4 border-b border-secondary-700 ${getStatusColor(healthStatus.status)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon(healthStatus.status)}
              <div>
                <h3 className="font-semibold text-white">System Health</h3>
                <p className="text-xs text-secondary-300 capitalize">
                  {healthStatus.status} • Score: {healthStatus.overallScore}/100
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-secondary-400">
                Uptime: {formatUptime(healthStatus.uptime)}
              </div>
              {lastUpdate && (
                <div className="flex items-center space-x-1 text-xs text-secondary-500">
                  <Clock className="w-3 h-3" />
                  <span>{lastUpdate.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="p-4">
          <div className="space-y-3">
            {Object.entries(healthStatus.services).map(([name, service]) => (
              <ServiceHealthItem key={name} name={name} service={service} />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-secondary-900 border-t border-secondary-700">
          <div className="flex items-center justify-between text-xs text-secondary-500">
            <span>
              {Object.values(healthStatus.services).filter(s => s.critical).length} critical services
            </span>
            <span>
              Last check: {new Date(healthStatus.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ServiceHealthItemProps {
  name: string;
  service: ServiceHealth;
}

const ServiceHealthItem: React.FC<ServiceHealthItemProps> = ({ name, service }) => {
  const getServiceIcon = (serviceName: string) => {
    switch (serviceName) {
      case 'WebGL Rendering':
        return <Zap className="w-4 h-4" />;
      case 'Audio System':
        return <Wifi className="w-4 h-4" />;
      case 'Performance Monitoring':
        return <Activity className="w-4 h-4" />;
      case 'Local Storage':
        return <HardDrive className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-3 h-3 text-green-400" />;
      case 'degraded':
        return <AlertTriangle className="w-3 h-3 text-yellow-400" />;
      case 'unhealthy':
        return <XCircle className="w-3 h-3 text-red-400" />;
      default:
        return <Activity className="w-3 h-3 text-gray-400" />;
    }
  };

  const formatResponseTime = (time?: number) => {
    if (!time) return 'N/A';
    return `${Math.round(time)}ms`;
  };

  return (
    <div className="flex items-center justify-between p-3 bg-secondary-900 rounded-lg border border-secondary-700">
      <div className="flex items-center space-x-3">
        <div className="text-secondary-400">
          {getServiceIcon(name)}
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-white">{name}</span>
            {service.critical && (
              <span className="text-xs px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded">
                Critical
              </span>
            )}
          </div>
          {service.details && (
            <p className="text-xs text-secondary-400 mt-0.5">{service.details}</p>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <div className="text-right">
          <div className="text-xs text-secondary-400">
            {formatResponseTime(service.responseTime)}
          </div>
          {service.errorCount > 0 && (
            <div className="text-xs text-red-400">
              {service.errorCount} errors
            </div>
          )}
        </div>
        {getStatusIcon(service.status)}
      </div>
    </div>
  );
};

export default HealthStatusDashboard;
